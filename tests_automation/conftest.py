# tests_automation/conftest.py
import pytest
import os
from dotenv import load_dotenv
from utils.api_client import APIClient
from utils.data_generator import DataGenerator

load_dotenv() # Carrega o .env da automação

@pytest.fixture(scope="session")
def base_url():
    return os.getenv("BASE_URL")

@pytest.fixture(scope="session")
def faker():
    return DataGenerator()

@pytest.fixture(scope="session")
def api_client(base_url):
    """ Faz login uma vez por sessão e fornece o cliente autenticado """
    client = APIClient(base_url)
    client.login(os.getenv("TEST_USER"), os.getenv("TEST_PASSWORD"))
    assert client.is_authenticated(), "Falha ao autenticar na API para os testes"
    yield client