import re
from django.core.exceptions import ValidationError

def validate_cpf(value):
    cpf = ''.join(re.findall(r'\d', str(value)))
    if not cpf or len(cpf) != 11 or cpf == cpf[0] * 11:
        raise ValidationError('CPF inválido.')
    sum_ = sum(int(cpf[i]) * (10 - i) for i in range(9))
    digit1 = (sum_ * 10) % 11
    if digit1 == 10: digit1 = 0
    if digit1 != int(cpf[9]): raise ValidationError('CPF inválido.')
    sum_ = sum(int(cpf[i]) * (11 - i) for i in range(10))
    digit2 = (sum_ * 10) % 11
    if digit2 == 10: digit2 = 0
    if digit2 != int(cpf[10]): raise ValidationError('CPF inválido.')
    return value

def validate_rg(value):
    rg = ''.join(re.findall(r'[\dXx]', str(value).upper()))
    if not rg or len(rg) < 7 or len(rg) > 9:
         raise ValidationError('Formato de RG inválido.')
    return value

def validate_cnpj(value): # Novo validador ABNT
    cnpj = ''.join(re.findall(r'\d', str(value)))
    if len(cnpj) != 14 or cnpj == cnpj[0] * 14:
        raise ValidationError('CNPJ inválido.')
    # (Lógica de validação de CNPJ mais complexa pode ser adicionada aqui)
    return value