import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Adiciona a configuração de proxy
    proxy: {
      // Se o Vite receber um pedido para /api/token/...
      '/api': {
        // Reencaminha-o para o Nginx/Django na porta 80
        target: 'http://127.0.0.1:80', // Aponta para o Nginx na mesma máquina
        changeOrigin: true, // Necessário para evitar erros de CORS no proxy
        // Não precisamos de reescrever o caminho, pois /api já está correto
      }
    }
  }
})