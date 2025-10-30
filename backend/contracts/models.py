from django.db import models
import pytz
from django.conf import settings

# 1. ARQUIVO BASE (CRM) - Substitui 'Cliente'
class Entidade(models.Model):
    nome = models.CharField(max_length=255) # Razão Social ou Nome Completo
    is_pessoa_juridica = models.BooleanField(default=False)
    cpf = models.CharField(max_length=14, unique=True, null=True, blank=True)
    rg = models.CharField(max_length=12, null=True, blank=True)
    cnpj = models.CharField(max_length=18, unique=True, null=True, blank=True)
    endereco = models.TextField(blank=True, null=True)
    outros_dados = models.JSONField(default=dict, blank=True) # Para nacionalidade, profissão, etc.
    
    def __str__(self): return self.nome

# 2. LÓGICA DE QUALIFICAÇÃO (do 'qualificação.txt')
class TemplateQualificacao(models.Model):
    nome = models.CharField(max_length=100) # Ex: "Pessoa Física (Simples)"
    is_pessoa_juridica = models.BooleanField(default=False)
    template_html = models.TextField() # O bloco de texto ABNT com placeholders
    variaveis_necessarias = models.JSONField(default=list) # Ex: ["{{nome}}", "{{cpf}}"]

    def __str__(self): return self.nome

# 3. LÓGICA DE PARTES (do 'partes.txt')
class TipoParte(models.Model):
    nome = models.CharField(max_length=100) # Ex: "Locador", "Empregador"
    
    def __str__(self): return self.nome

# 4. LÓGICA DE CLÁUSULAS (do 'Clausulas.txt')
class Clausula(models.Model):
    titulo = models.CharField(max_length=255)
    conteudo_padrao = models.TextField()
    requer_anexo = models.BooleanField(default=False)
    
    def __str__(self): return self.titulo

# 5. LÓGICA DE MODELOS (do 'modelos.txt')
class TipoContrato(models.Model):
    nome = models.CharField(max_length=255) # Ex: "Contrato de Locação"
    descricao = models.TextField(blank=True, null=True)
    partes_requeridas = models.ManyToManyField(TipoParte) # Ex: "Locador", "Locatário"
    clausulas_base = models.ManyToManyField(Clausula, blank=True) # Cláusulas sugeridas

    def __str__(self): return self.nome

# 6. RASCUNHO
class RascunhoContrato(models.Model):
    class StatusContrato(models.TextChoices):
        RASCUNHO = 'RASCUNHO', 'Rascunho'
        REVISAO = 'REVISAO', 'Em Revisão'
        FINALIZADO = 'FINALIZADO', 'Finalizado'

    titulo_documento = models.CharField(max_length=255, blank=True)
    tipo_contrato = models.ForeignKey(TipoContrato, on_delete=models.SET_NULL, null=True)
    partes_atribuidas = models.JSONField(default=dict)
    variaveis_preenchidas = models.JSONField(default=dict)
    clausulas_finais = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=StatusContrato.choices, default=StatusContrato.RASCUNHO)
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    def __str__(self): return self.titulo_documento or f"Rascunho {self.id}"

# 7. ANEXOS
class Anexo(models.Model):
    rascunho = models.ForeignKey(RascunhoContrato, related_name='anexos', on_delete=models.CASCADE)
    arquivo = models.FileField(upload_to='anexos/')
    nome_arquivo = models.CharField(max_length=255)
    data_upload = models.DateTimeField(auto_now_add=True)
    
    def __str__(self): return self.nome_arquivo

# 8. HISTÓRICO DE VERSÕES DO RASCUNHO (NOVO MODELO)

# 8. HISTÓRICO DE VERSÕES DO RASCUNHO (NOVO MODELO)
class HistoricoRascunho(models.Model):
    rascunho = models.ForeignKey(RascunhoContrato, related_name='historico', on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, # Se o usuário for deletado, mantém o histórico
        null=True,
        blank=True
    )
    dados_rascunho = models.JSONField(default=dict)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        try:
            tz = pytz.timezone(settings.TIME_ZONE)
        except Exception:
            tz = None

        if tz:
            local_timestamp = self.timestamp.astimezone(tz)
        else:
            local_timestamp = self.timestamp

        formatted_time = local_timestamp.strftime('%d/%m/%Y %H:%M:%S')
        user_info = f" por {self.usuario.username}" if self.usuario else ""
        return f"Versão de {self.rascunho.titulo_documento or f'Rascunho {self.rascunho_id}'} em {formatted_time}{user_info}"
