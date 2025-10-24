import re
from rest_framework import serializers
from .models import *
from .validators import validate_cpf, validate_rg, validate_cnpj

class EntidadeSerializer(serializers.ModelSerializer):
    cpf = serializers.CharField(validators=[validate_cpf], required=False, allow_blank=True, allow_null=True)
    rg = serializers.CharField(validators=[validate_rg], required=False, allow_blank=True, allow_null=True)
    cnpj = serializers.CharField(validators=[validate_cnpj], required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = Entidade
        fields = ['id', 'nome', 'is_pessoa_juridica', 'cpf', 'rg', 'cnpj', 'endereco', 'outros_dados']

class TemplateQualificacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateQualificacao
        fields = '__all__'

class TipoParteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoParte
        fields = '__all__'

class ClausulaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clausula
        fields = '__all__'

class TipoContratoSerializer(serializers.ModelSerializer):
    partes_requeridas = TipoParteSerializer(many=True, read_only=True)
    clausulas_base = ClausulaSerializer(many=True, read_only=True)
    
    class Meta:
        model = TipoContrato
        fields = ['id', 'nome', 'descricao', 'partes_requeridas', 'clausulas_base']

class RascunhoContratoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RascunhoContrato
        fields = '__all__'

class AnexoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Anexo
        fields = ['id', 'rascunho', 'arquivo', 'nome_arquivo', 'data_upload']
        read_only_fields = ['nome_arquivo', 'data_upload']