# tests_automation/tests/load/locustfile.py
from locust import HttpUser, task, between
import os

class ApiUser(HttpUser):
    wait_time = between(1, 3) # Usuário espera entre 1-3 segundos
    token = None

    def on_start(self):
        """ Obtém o token JWT antes de iniciar os testes """
        res = self.client.post("/api/token/", {
            "username": os.getenv("TEST_USER"),
            "password": os.getenv("TEST_PASSWORD")
        })
        if res.status_code == 200:
            self.token = res.json()["access"]
            self.client.headers["Authorization"] = f"Bearer {self.token}"
        else:
            print("Falha ao logar usuário do Locust")

    @task(10) # Tarefa mais comum
    def get_entidades(self):
        self.client.get("/api/entidades/")

    @task(5)
    def get_clausulas(self):
        self.client.get("/api/clausulas/")

    @task(1) # Tarefa menos comum
    def get_rascunho_especifico(self):
        # (Assume que o rascunho ID=1 existe)
        self.client.get("/api/rascunhos/1/")