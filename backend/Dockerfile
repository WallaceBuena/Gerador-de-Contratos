# backend/Dockerfile

# Use uma imagem oficial do Python como base
FROM python:3.11-slim-bullseye

# Defina variáveis de ambiente para o Python
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Defina o diretório de trabalho dentro do container
WORKDIR /app

# Instale dependências do sistema (necessárias para psycopg2 e pypandoc)
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev pandoc \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Instale dependências do Python
COPY requirements.txt /app/
RUN pip install --upgrade pip && \
    pip install wheel && \
    pip install -r requirements.txt

# Copie o código do projeto backend para dentro do container
COPY . /app/

# Exponha a porta onde o Gunicorn será executado
EXPOSE 8000

# Comando para rodar a aplicação usando Gunicorn
# Adaptado para o nome do seu projeto: 'srv_contratos'
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "srv_contratos.wsgi:application"]
