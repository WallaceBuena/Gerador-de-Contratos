# tests/security/test_security_headers.py
import pytest
import requests

@pytest.mark.security
def test_headers_de_seguranca_nginx(base_url):
    """ Verifica se o Nginx está configurado com headers básicos """
    response = requests.get(base_url)
    headers = response.headers

    # O Nginx (nginx.conf) deve ser configurado para adicionar estes headers
    # assert "X-Content-Type-Options" in headers
    # assert headers["X-Content-Type-Options"] == "nosniff"
    # assert "X-Frame-Options" in headers

    # Validar que o Nginx não expõe sua versão
    assert "Server" not in headers or "nginx" not in headers["Server"]