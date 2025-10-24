from django.contrib import admin
from .models import (
    Entidade, 
    TemplateQualificacao, 
    TipoParte, 
    Clausula, 
    TipoContrato, 
    RascunhoContrato, 
    Anexo
)

# Registra todos os novos modelos do Sprint F para que apareçam no Admin
admin.site.register(Entidade)
admin.site.register(TemplateQualificacao)
admin.site.register(TipoParte)
admin.site.register(Clausula)
admin.site.register(TipoContrato)
admin.site.register(RascunhoContrato)
admin.site.register(Anexo)