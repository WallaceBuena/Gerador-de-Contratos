# tests/ui/test_login_page.py
import pytest
import os
from pages.login_page import LoginPage
from selenium.webdriver.common.by import By # Para checagem

@pytest.mark.ui
def test_login_ui_com_sucesso(driver):
    login_page = LoginPage(driver)
    login_page.ir_para_pagina()

    login_page.fazer_login(
        os.getenv("TEST_USER"),
        os.getenv("TEST_PASSWORD")
    )

    # Verificar se fomos para o Dashboard (pelo título)
    # (Idealmente, criar a DashboardPage e checar um elemento)
    dashboard_titulo = (By.XPATH, "//h1[contains(text(), 'Olá,')]")
    login_page.wait.until(EC.visibility_of_element_located(dashboard_titulo))

    assert "/login" not in driver.current_url