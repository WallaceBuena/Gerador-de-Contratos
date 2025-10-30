# tests_automation/pages/login_page.py
from selenium.webdriver.common.by import By
from pages.base_page import BasePage

class LoginPage(BasePage):
    # Locators
    USERNAME_INPUT = (By.ID, "username")
    PASSWORD_INPUT = (By.ID, "password")
    LOGIN_BUTTON = (By.CSS_SELECTOR, "button[type='submit']")

    def __init__(self, driver):
        super().__init__(driver)
        self.path = "/login"

    def ir_para_pagina(self):
        self.driver.get(f"{self.driver.base_url}{self.path}")

    def fazer_login(self, username, password):
        self.preencher(self.USERNAME_INPUT, username)
        self.preencher(self.PASSWORD_INPUT, password)
        self.clicar(self.LOGIN_BUTTON)