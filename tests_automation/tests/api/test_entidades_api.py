# tests_automation/tests/api/test_entidades_api.py
import pytest

@pytest.mark.api
def test_criar_e_deletar_entidade_pf(api_client, faker):
    # 1. Criar Entidade (Pessoa Física)
    payload = faker.entidade_pessoa_fisica()
    response_create = api_client.post("/api/entidades/", data=payload)

    assert response_create.status_code == 201
    data = response_create.json()
    entidade_id = data.get("id")
    assert entidade_id is not None
    assert data.get("nome") == payload["nome"]
    assert data.get("cpf") == payload["cpf"]

    # 2. Buscar Entidade criada
    response_get = api_client.get(f"/api/entidades/{entidade_id}/")
    assert response_get.status_code == 200
    assert response_get.json().get("id") == entidade_id

    # 3. Limpeza (Teardown) - Deletar a entidade
    response_delete = api_client.delete(f"/api/entidades/{entidade_id}/")
    assert response_delete.status_code == 204

    # 4. Verificar se foi deletado
    response_get_after = api_client.get(f"/api/entidades/{entidade_id}/")
    assert response_get_after.status_code == 404