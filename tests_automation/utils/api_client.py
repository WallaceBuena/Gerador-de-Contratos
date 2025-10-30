# tests_automation/utils/api_client.py
import requests

class APIClient:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self.token = None

    def login(self, username, password):
        try:
            response = self.session.post(
                f"{self.base_url}/api/token/", 
                data={"username": username, "password": password}
            )
            response.raise_for_status()
            self.token = response.json().get("access")
            if self.token:
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        except requests.exceptions.RequestException as e:
            print(f"Erro ao fazer login na API: {e}")
            raise

    def is_authenticated(self):
        return self.token is not None

    def post(self, endpoint, data):
        return self.session.post(f"{self.base_url}{endpoint}", json=data)

    def get(self, endpoint, params=None):
        return self.session.get(f"{self.base_url}{endpoint}", params=params)

    def put(self, endpoint, data):
        return self.session.put(f"{self.base_url}{endpoint}", json=data)

    def delete(self, endpoint):
        return self.session.delete(f"{self.base_url}{endpoint}")