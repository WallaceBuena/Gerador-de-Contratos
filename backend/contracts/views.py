from rest_framework import generics, status, viewsets
from rest_framework.views import APIView
from rest_framework.decorators import action # Importar action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FileUploadParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import * # Importa os novos modelos (Entidade, TipoContrato, etc)
from .serializers import * # Importa os novos serializers
from .serializers import RascunhoContratoSerializer # Precisa importar o serializer
from django.shortcuts import get_object_or_404 # Para buscar o objeto manualmente
from django.http import HttpResponse
import pypandoc
import docx
import requests
import logging
import tempfile
import os
import re


logger = logging.getLogger(__name__)

class RascunhoContratoViewSet(viewsets.ViewSet): # <--- MUDANÇA AQUI
    # queryset = RascunhoContrato.objects.all() # <-- COMENTE TEMPORARIAMENTE
    # serializer_class = RascunhoContratoSerializer # <-- COMENTE TEMPORARIAMENTE

    # Removemos o @action antes, então mantenha comentado
    # @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):
        """
        Atualiza o status de um rascunho de contrato.
        Espera um payload como: {"status": "REVISAO"}
        """
        # Como não estamos mais usando get_object() do ModelViewSet,
        # precisamos buscar o objeto manualmente.
        rascunho = get_object_or_404(RascunhoContrato, pk=pk) # <-- MUDANÇA AQUI

        new_status = request.data.get('status')

        valid_statuses = [choice[0] for choice in RascunhoContrato.StatusContrato.choices]
        if not new_status or new_status not in valid_statuses:
            return Response(
                {"error": f"Status inválido. Status válidos são: {', '.join(valid_statuses)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        rascunho.status = new_status
        rascunho.save(update_fields=['status'])

        # Precisamos instanciar o serializer manualmente agora
        serializer = RascunhoContratoSerializer(rascunho) # <-- MUDANÇA AQUI
        return Response(serializer.data, status=status.HTTP_200_OK)
    
# --- NOVOS VIEWSETS (SPRINT F) ---
class EntidadeViewSet(viewsets.ModelViewSet):
    queryset = Entidade.objects.all()
    serializer_class = EntidadeSerializer

class TemplateQualificacaoViewSet(viewsets.ModelViewSet):
    queryset = TemplateQualificacao.objects.all()
    serializer_class = TemplateQualificacaoSerializer

class TipoParteViewSet(viewsets.ModelViewSet):
    queryset = TipoParte.objects.all()
    serializer_class = TipoParteSerializer

class ClausulaViewSet(viewsets.ModelViewSet):
    queryset = Clausula.objects.all()
    serializer_class = ClausulaSerializer

class TipoContratoViewSet(viewsets.ModelViewSet):
    queryset = TipoContrato.objects.all()
    serializer_class = TipoContratoSerializer

class RascunhoContratoViewSet(viewsets.ModelViewSet):
    queryset = RascunhoContrato.objects.all()
    serializer_class = RascunhoContratoSerializer
    # (Adicionar filtro por usuário logado aqui no futuro)

class AnexoViewSet(viewsets.ModelViewSet):
    queryset = Anexo.objects.all()
    serializer_class = AnexoSerializer
    parser_classes = [MultiPartParser, FileUploadParser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        rascunho_id = self.request.query_params.get('rascunho')
        if rascunho_id:
            queryset = queryset.filter(rascunho_id=rascunho_id)
        return queryset

    def create(self, request, *args, **kwargs):
        file_obj = request.data['arquivo']
        rascunho_id = request.data['rascunho']
        anexo = Anexo.objects.create(rascunho_id=rascunho_id, arquivo=file_obj, nome_arquivo=file_obj.name)
        serializer = self.get_serializer(anexo)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# --- VIEWS DE UTILITÁRIOS (Mantidas) ---

class ImportClauseTextView(APIView):
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
    permission_classes = [AllowAny]
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