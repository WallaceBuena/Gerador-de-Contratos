# backend/srv_contratos/settings.py

import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv  # Importe o dotenv

# BASE_DIR agora aponta para a pasta 'backend'
BASE_DIR = Path(__file__).resolve().parent.parent

# Carregue variáveis de ambiente do arquivo .env na pasta 'backend'
load_dotenv(os.path.join(BASE_DIR, '.env'))

# Chave secreta lida do .env
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')

# Debug lido do .env (converte 'True' (string) para True (booleano))
DEBUG = os.getenv('DEBUG', 'False') == 'True'

# ALLOWED_HOSTS para Nginx e desenvolvimento local
ALLOWED_HOSTS = ['django_backend_contratos', '192.168.255.169', 'localhost', '127.0.0.1']
#ALLOWED_HOSTS = ['localhost', '127.0.0.1', '192.168.255.169']


# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'contracts', # Nosso app
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware', # CORS
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Nome do projeto renomeado na Fase 1
ROOT_URLCONF = 'srv_contratos.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Nome do projeto renomeado na Fase 1
WSGI_APPLICATION = 'srv_contratos.wsgi.application'


# Database (lendo do .env)
# O HOST 'db' é o nome do serviço Postgres no docker-compose.yml
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB'),
        'USER': os.getenv('POSTGRES_USER'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD'),
        'HOST': os.getenv('POSTGRES_HOST'),
        'PORT': os.getenv('POSTGRES_PORT'),
    }
}


# Password validation
# (Mantém as suas validações de senha existentes)
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
# Diretório onde o 'collectstatic' reunirá os arquivos para produção (usado pelo Nginx)
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media files (Uploads)
MEDIA_URL = '/media/'
# Diretório para uploads de usuários (usado pelo Nginx)
MEDIA_ROOT = os.path.join(BASE_DIR, 'mediafiles')


# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173", # Para desenvolvimento do frontend (npm run dev)
    "http://127.0.0.1:5173", # Para desenvolvimento do frontend (npm run dev)
    "http://localhost",     # Para o frontend acedendo via Nginx (porta 80)
    "http://127.0.0.1",     # Para o frontend acedendo via Nginx (porta 80)
    "http://192.168.255.169:5173",
]

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated', # Protege tudo por padrão
    ),
}

# JWT
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
}
