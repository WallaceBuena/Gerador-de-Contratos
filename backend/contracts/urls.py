from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views # Importa o views.py que acabamos de corrigir

router = DefaultRouter()
# Registra os NOVOS ViewSets do Sprint F
router.register(r'entidades', views.EntidadeViewSet, basename='entidade')
router.register(r'qualificacoes', views.TemplateQualificacaoViewSet, basename='qualificacao')
router.register(r'tipos-parte', views.TipoParteViewSet, basename='tipoparte')
router.register(r'clausulas', views.ClausulaViewSet, basename='clausula')
router.register(r'tipos-contrato', views.TipoContratoViewSet, basename='tipocontrato')
router.register(r'rascunhos', views.RascunhoContratoViewSet, basename='rascunho')
router.register(r'anexos', views.AnexoViewSet, basename='anexo')

urlpatterns = [
    # Inclui as rotas do router
    path('', include(router.urls)),
    
    # Mantém as rotas de utilitários
    path('export/docx/', views.ExportDocxView.as_view(), name='export-docx'),
    path('utils/viacep/<str:cep>/', views.ViaCEPView.as_view(), name='viacep-proxy'),
    path('clauses/import_text/', views.ImportClauseTextView.as_view(), name='import-clause-text'),
]