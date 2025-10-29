from rest_framework import generics, status, viewsets
from rest_framework.views import APIView
from rest_framework.decorators import action # Importar action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FileUploadParser
from rest_framework.permissions import AllowAny, IsAuthenticated # IsAuthenticated será usado
from .models import * 
from .serializers import * 
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
        queryset = super().get_queryset().filter(rascunho__usuario=self.request.user)
        rascunho_id = self.request.query_params.get('rascunho')
        if rascunho_id:
            # Idealmente, filtrar também pelo usuário dono do rascunho no futuro
            queryset = queryset.filter(rascunho_id=rascunho_id)
        # Filtrar pelo usuário dono do rascunho no futuro aqui também
        queryset = queryset.filter(rascunho__usuario=self.request.user) # Exemplo futuro
        return queryset

    def perform_create(self, serializer):
        rascunho = serializer.save(usuario=self.request.user) # Garanta que esta linha exista e esteja descomentada
        # Validação extra: garantir que o rascunho pertence ao usuário logado (implementar no futuro)
        rascunho_id = self.request.data.get('rascunho')
        try:
            rascunho = RascunhoContrato.objects.get(pk=rascunho_id, usuario=self.request.user) #
            file_obj = self.request.data['arquivo']
            serializer.save(rascunho=rascunho, nome_arquivo=file_obj.name) # Passa o rascunho validado e o nome
        except RascunhoContrato.DoesNotExist:
            raise serializers.ValidationError("Rascunho não encontrado ou não pertence ao usuário.")
        except KeyError:
             raise serializers.ValidationError("Dados incompletos para criar anexo (falta 'arquivo' ou 'rascunho').")


# --- VIEWSET RASCUNHO COM HISTÓRICO E ACTION ---
class RascunhoContratoViewSet(viewsets.ModelViewSet):
    queryset = RascunhoContrato.objects.all()
    serializer_class = RascunhoContratoSerializer
    permission_classes = [IsAuthenticated] # Proteger por padrão

    def get_queryset(self):
        # Filtrar para mostrar apenas rascunhos do usuário logado (IMPLEMENTAR FUTURAMENTE)
        # return RascunhoContrato.objects.filter(usuario=self.request.user)
        return RascunhoContrato.objects.all() # Temporário: mostra todos

    # --- MÉTODO CHAMADO QUANDO UM RASCUNHO É CRIADO (POST) ---
    def perform_create(self, serializer):
        # Adicionar o usuário logado ao salvar (IMPLEMENTAR FUTURAMENTE, requer campo no RascunhoContrato)
        # rascunho = serializer.save(usuario=self.request.user)
        rascunho = serializer.save() # Salva o rascunho primeiro
            # --- ADICIONE ESTAS LINHAS PARA DEBUG ---
        print("--- Campos do Modelo HistoricoRascunho ---")
        print([field.name for field in HistoricoRascunho._meta.get_fields()])
        print("---------------------------------------")
            # --- FIM DAS LINHAS DE DEBUG ---


        # Cria a primeira entrada no histórico associando o usuário
        HistoricoRascunho.objects.create(
            rascunho=rascunho,
            usuario=self.request.user if self.request.user.is_authenticated else None, # Associa usuário logado
            dados_rascunho={
                'titulo_documento': rascunho.titulo_documento,
                'partes_atribuidas': rascunho.partes_atribuidas,
                'variaveis_preenchidas': rascunho.variaveis_preenchidas,
                'clausulas_finais': rascunho.clausulas_finais,
                'status': rascunho.status,
            }
        )

    # --- MÉTODO CHAMADO QUANDO UM RASCUNHO É ATUALIZADO (PUT/PATCH geral) ---
    def perform_update(self, serializer):
        rascunho = serializer.save() # Salva as alterações no rascunho

        # Cria uma nova entrada no histórico associando o usuário
        HistoricoRascunho.objects.create(
            rascunho=rascunho,
            usuario=self.request.user if self.request.user.is_authenticated else None, # Associa usuário logado
            dados_rascunho={
                'titulo_documento': rascunho.titulo_documento,
                'partes_atribuidas': rascunho.partes_atribuidas,
                'variaveis_preenchidas': rascunho.variaveis_preenchidas,
                'clausulas_finais': rascunho.clausulas_finais,
                'status': rascunho.status,
            }
        )

    # --- ACTION PARA ATUALIZAR STATUS ESPECIFICAMENTE ---
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):
        """
        Atualiza o status de um rascunho de contrato.
        Espera um payload como: {"status": "REVISAO"}
        """
        try:
            rascunho = self.get_object() # Obtém o rascunho pelo pk
            # Verificar permissão do usuário aqui no futuro
            # if rascunho.usuario != request.user:
            #     return Response({"error": "Permissão negada."}, status=status.HTTP_403_FORBIDDEN)
        except RascunhoContrato.DoesNotExist:
             return Response({"error": "Rascunho não encontrado."}, status=status.HTTP_404_NOT_FOUND)


        new_status = request.data.get('status')

        # Validação do status
        valid_statuses = [choice[0] for choice in RascunhoContrato.StatusContrato.choices]
        if not new_status or new_status not in valid_statuses:
            return Response(
                {"error": f"Status inválido. Status válidos são: {', '.join(valid_statuses)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Salva o status anterior para comparar se houve mudança
        old_status = rascunho.status

        # Atualiza o status e salva
        rascunho.status = new_status
        rascunho.save(update_fields=['status'])

        # Cria entrada no histórico SOMENTE se o status mudou através desta action específica
        if old_status != new_status:
            HistoricoRascunho.objects.create(
                rascunho=rascunho,
                usuario=self.request.user if self.request.user.is_authenticated else None,
                dados_rascunho={
                    'titulo_documento': rascunho.titulo_documento,
                    'partes_atribuidas': rascunho.partes_atribuidas, # Pode ser otimizado para não guardar tudo só pela mudança de status
                    'variaveis_preenchidas': rascunho.variaveis_preenchidas,
                    'clausulas_finais': rascunho.clausulas_finais,
                    'status': rascunho.status, # Guarda o novo status
                    # Adiciona uma nota sobre a mudança de status
                    'evento': f'Status alterado de {old_status} para {new_status}'
                }
            )

        serializer = self.get_serializer(rascunho)
        return Response(serializer.data, status=status.HTTP_200_OK)


# --- VIEWS DE UTILITÁRIOS (Mantidas) ---

class ImportClauseTextView(APIView):
    permission_classes = [IsAuthenticated] # Proteger
    parser_classes = [MultiPartParser]
    # ... (código do método post sem alterações) ...
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
    permission_classes = [IsAuthenticated] # Proteger
    # ... (código do método post sem alterações) ...
    def post(self, request, format=None):
        html_content = request.data.get('html')
        if not html_content:
            return Response({"error": "Nenhum conteúdo HTML fornecido."}, status=status.HTTP_400_BAD_REQUEST)
        temp_file_path = None
        try:
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
    # ... (código do método get sem alterações) ...
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