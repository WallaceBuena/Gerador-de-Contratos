from rest_framework import generics, status, viewsets
from rest_framework.views import APIView
from rest_framework.decorators import action # Importar action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FileUploadParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import * # Importa todos os modelos, incluindo HistoricoRascunho
from .serializers import * # Importa todos os serializers
from django.conf import settings
from django.http import HttpResponse
import pypandoc
import docx
import requests
import logging
import tempfile
import os
import re

logger = logging.getLogger(__name__)

# --- VIEWSETS PADRÃO ---
class EntidadeViewSet(viewsets.ModelViewSet):
    queryset = Entidade.objects.all()
    serializer_class = EntidadeSerializer
    permission_classes = [IsAuthenticated] # Proteger por padrão

class TemplateQualificacaoViewSet(viewsets.ModelViewSet):
    queryset = TemplateQualificacao.objects.all()
    serializer_class = TemplateQualificacaoSerializer
    permission_classes = [IsAuthenticated] # Proteger por padrão

class TipoParteViewSet(viewsets.ModelViewSet):
    queryset = TipoParte.objects.all()
    serializer_class = TipoParteSerializer
    permission_classes = [IsAuthenticated] # Proteger por padrão

class ClausulaViewSet(viewsets.ModelViewSet):
    queryset = Clausula.objects.all()
    serializer_class = ClausulaSerializer
    permission_classes = [IsAuthenticated] # Proteger por padrão

class TipoContratoViewSet(viewsets.ModelViewSet):
    queryset = TipoContrato.objects.all()
    serializer_class = TipoContratoSerializer
    permission_classes = [IsAuthenticated] # Proteger por padrão

class AnexoViewSet(viewsets.ModelViewSet):
    queryset = Anexo.objects.all()
    serializer_class = AnexoSerializer
    parser_classes = [MultiPartParser, FileUploadParser]
    permission_classes = [IsAuthenticated] # Proteger por padrão

    def get_queryset(self):
        # Filtra por usuário (a implementar quando RascunhoContrato tiver 'usuario')
        # queryset = super().get_queryset().filter(rascunho__usuario=self.request.user)
        queryset = super().get_queryset() # Temporário
        rascunho_id = self.request.query_params.get('rascunho')
        if rascunho_id:
            queryset = queryset.filter(rascunho_id=rascunho_id)
        return queryset

    def create(self, request, *args, **kwargs):
        # Sobrescreve 'create' para lidar corretamente com 'perform_create'
        # (O seu 'perform_create' tinha uma lógica mista)
        rascunho_id = request.data.get('rascunho')
        file_obj = request.data.get('arquivo')

        if not rascunho_id or not file_obj:
             raise serializers.ValidationError("Dados incompletos (falta 'arquivo' ou 'rascunho').")
        
        try:
            # Validação: garantir que o rascunho existe
            rascunho = RascunhoContrato.objects.get(pk=rascunho_id)
            # (Adicionar verificação de usuário no futuro: rascunho__usuario=self.request.user)
        except RascunhoContrato.DoesNotExist:
            raise serializers.ValidationError("Rascunho não encontrado ou não pertence ao usuário.")

        # Cria o anexo e salva
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(rascunho=rascunho, nome_arquivo=file_obj.name)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


# --- VIEWSET RASCUNHO COM HISTÓRICO E ACTION ---
class RascunhoContratoViewSet(viewsets.ModelViewSet):
    queryset = RascunhoContrato.objects.all()
    serializer_class = RascunhoContratoSerializer
    permission_classes = [IsAuthenticated] # Proteger por padrão

    def get_queryset(self):
        # (Implementar filtro por usuário no futuro)
        return RascunhoContrato.objects.all()

    def _criar_historico(self, rascunho, evento_especial=None):
        """Função helper para criar entrada de histórico."""
        dados = {
            'titulo_documento': rascunho.titulo_documento,
            'partes_atribuidas': rascunho.partes_atribuidas,
            'variaveis_preenchidas': rascunho.variaveis_preenchidas,
            'clausulas_finais': rascunho.clausulas_finais,
            'status': rascunho.status,
        }
        if evento_especial:
            dados['evento'] = evento_especial

        HistoricoRascunho.objects.create(
            rascunho=rascunho,
            usuario=self.request.user if self.request.user.is_authenticated else None,
            dados_rascunho=dados
        )

    # --- MÉTODO CHAMADO QUANDO UM RASCUNHO É CRIADO (POST) ---
    def perform_create(self, serializer):
        # (Adicionar 'usuario=self.request.user' aqui se o RascunhoContrato tiver esse campo)
        rascunho = serializer.save()
        self._criar_historico(rascunho, evento_especial="Criação do Rascunho")

    # --- MÉTODO CHAMADO QUANDO UM RASCUNHO É ATUALIZADO (PUT/PATCH geral) ---
    def perform_update(self, serializer):
        rascunho = serializer.save()
        self._criar_historico(rascunho, evento_especial="Rascunho atualizado (Salvar)")

    # --- ACTION PARA ATUALIZAR STATUS ESPECIFICAMENTE ---
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):
        """
        Atualiza o status de um rascunho de contrato.
        Espera um payload como: {"status": "REVISAO"}
        """
        try:
            rascunho = self.get_object()
        except RascunhoContrato.DoesNotExist:
             return Response({"error": "Rascunho não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        old_status = rascunho.status

        # Validação do status
        valid_statuses = [choice[0] for choice in RascunhoContrato.StatusContrato.choices]
        if not new_status or new_status not in valid_statuses:
            return Response(
                {"error": f"Status inválido. Status válidos são: {', '.join(valid_statuses)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if old_status == new_status:
            return Response(self.get_serializer(rascunho).data, status=status.HTTP_200_OK) # Nenhum
            
        rascunho.status = new_status
        rascunho.save(update_fields=['status'])

        # Cria entrada no histórico SOMENTE se o status mudou
        self._criar_historico(rascunho, evento_especial=f'Status alterado de {old_status} para {new_status}')

        serializer = self.get_serializer(rascunho)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    # --- ACTION PARA LER O HISTÓRICO ---
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def historico(self, request, pk=None):
        """
        Retorna o histórico de versões de um rascunho.
        """
        rascunho = self.get_object() # Obtém o rascunho
        # Busca o histórico ordenado (o Meta no modelo já faz isso, mas garantimos)
        historico = rascunho.historico.all().order_by('-timestamp')
        
        # (Adicionar paginação no futuro se o histórico ficar muito grande)
        
        # Precisamos de um serializer para o HistoricoRascunho
        # Como ainda não temos um, vamos retornar os dados manualmente (simples)
        # (O ideal é criar um HistoricoRascunhoSerializer)
        
        dados_historico = [
            {
                "id": h.id,
                "timestamp": h.timestamp,
                "usuario": h.usuario.username if h.usuario else "Sistema",
                "evento": h.dados_rascunho.get('evento', 'Atualização')
            }
            for h in historico
        ]
        
        return Response(dados_historico, status=status.HTTP_200_OK)


# --- VIEWS DE UTILITÁRIOS (Mantidas) ---
# (Protegidas com IsAuthenticated, exceto ViaCEP)

class ImportClauseTextView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]
    def post(self, request, format=None):
        file_obj = request.data['file']
        if file_obj.name.endswith('.docx'):
            try:
                doc = docx.Document(file_obj)
                full_text = [para.text for para in doc.paragraphs]
                return Response({"texto": '\n'.join(full_text)}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({"error": f"Erro ao ler DOCX: {e}"}, status=status.HTTP_400_BAD_REQUEST)
        elif file_obj.name.endswith('.txt'):
            try:
                texto = file_obj.read().decode('utf-8')
                return Response({"texto": texto}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({"error": f"Erro ao ler TXT: {e}"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"error": "Formato de arquivo não suportado."}, status=status.HTTP_400_BAD_REQUEST)

class ExportDocxView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, format=None):
        html_content = request.data.get('html')
        if not html_content:
            return Response({"error": "Nenhum conteúdo HTML fornecido."}, status=status.HTTP_400_BAD_REQUEST)
        temp_file_path = None
        try:
            # Garante que pypandoc está instalado no container (feito no Dockerfile)
            with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tf:
                temp_file_path = tf.name
            pypandoc.convert_text(html_content, 'docx', format='html', outputfile=temp_file_path)
            with open(temp_file_path, 'rb') as f:
                file_data = f.read()
            response = HttpResponse(file_data, content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
            response['Content-Disposition'] = 'attachment; filename="contrato.docx"'
            return response
        except Exception as e:
            error_message = f"ERRO DETALHADO DO PYPANDOC: {str(e)}"
            print(error_message)
            logger.error(error_message)
            return Response({"error": error_message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                os.remove(temp_file_path)

class ViaCEPView(APIView):
    permission_classes = [AllowAny] # Manter como AllowAny
    def get(self, request, cep, format=None):
        cep_limpo = ''.join(re.findall(r'\d', str(cep)))
        if len(cep_limpo) != 8:
            return Response({"error": "CEP deve conter 8 dígitos."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            response = requests.get(f"https://viacep.com.br/ws/{cep_limpo}/json/")
            response.raise_for_status()
            data = response.json()
            if data.get("erro"):
                return Response({"error": "CEP não encontrado."}, status=status.HTTP_404_NOT_FOUND)
            return Response(data, status=status.HTTP_200_OK)
        except requests.RequestException as e:
            return Response({"error": f"Erro ao consultar ViaCEP: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
