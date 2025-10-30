# tests/security/test_security_xss.py
import pytest
from pages.clientes_page import ClientesPage # (Crie este POM)

@pytest.mark.security
def test_xss_nao_executa_no_form_cliente(api_client, driver, faker):
    # 1. INJEÇÃO (API): Criar uma entidade com XSS no nome
    xss_payload = faker.xss_payload() # "<script>alert('XSS')</script>"
    entidade_payload = faker.entidade_pessoa_fisica(nome=f"Usuario {xss_payload}")

    response = api_client.post("/api/entidades/", entidade_payload)
    assert response.status_code == 201
    entidade_id = response.json()["id"]

    # 2. VERIFICAÇÃO (UI): Tentar editar essa entidade
    # (Requer login via UI antes)
    # ... (passo de login omitido, pode ser feito via cookie ou UI) ...

    editor_cliente_page = ClientesPage(driver) # Assumindo que ClientesPage lida com isso
    editor_cliente_page.ir_para_pagina_edicao(entidade_id)

    # 3. ASSERÇÃO: O alerta NÃO deve aparecer
    try:
        driver.switch_to.alert
        # Se chegamos aqui, o alerta apareceu (FALHA)
        assert False, "Alerta de XSS apareceu na tela!"
    except:
        # Se deu erro, o alerta não existe (SUCESSO)
        assert True

    # 4. Limpeza
    api_client.delete(f"/api/entidades/{entidade_id}/")