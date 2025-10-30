# tests_automation/pages/base_page.py
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class BasePage:
    """ Métodos utilitários para todas as Page Objects """
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10) # Timeout de 10s

    def encontrar_elemento(self, locator):
        return self.wait.until(EC.visibility_of_element_located(locator))

    def clicar(self, locator):
        self.wait.until(EC.element_to_be_clickable(locator)).click()

    def preencher(self, locator, texto):
        elemento = self.encontrar_elemento(locator)
        elemento.clear()
        elemento.send_keys(texto)