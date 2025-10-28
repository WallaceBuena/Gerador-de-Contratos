from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views # Apenas esta importação de views é necessária

router = DefaultRouter()
# Registra os NOVOS ViewSets do Sprint F
router.register(r'entidades', views.EntidadeViewSet, basename='entidade')
router.register(r'qualificacoes', views.TemplateQualificacaoViewSet, basename='qualificacao')
router.register(r'tipos-parte', views.TipoParteViewSet, basename='tipoparte')
router.register(r'clausulas', views.ClausulaViewSet, basename='clausula')
router.register(r'tipos-contrato', views.TipoContratoViewSet, basename='tipocontrato')
router.register(r'rascunhos', views.RascunhoContratoViewSet, basename='rascunho') # <--- O ViewSet está registrado aqui
router.register(r'anexos', views.AnexoViewSet, basename='anexo')

urlpatterns = [
    # Inclui as rotas do router (que agora deve incluir a rota do @action)
    path('', include(router.urls)),

    # Mantém as rotas de utilitários
    path('export/docx/', views.ExportDocxView.as_view(), name='export-docx'),
    path('utils/viacep/<str:cep>/', views.ViaCEPView.as_view(), name='viacep-proxy'),
    path('clauses/import_text/', views.ImportClauseTextView.as_view(), name='import-clause-text'),

    # --- REMOVA A LINHA ABAIXO ---
    # path('rascunhos/<int:pk>/update_status/', views.UpdateRascunhoStatusView.as_view(), name='rascunho-update-status'),
]
print('--- URLs Geradas pelo Router (Após Refatoração) ---') # Linha para adicionar
print(router.urls)                                          # Linha para adicionar
print('--------------------------------------------------')