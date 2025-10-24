import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Importa do contexto

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth(); // Usa a função de login do contexto

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(username, password);
      // O redirecionamento é tratado dentro do AuthContext
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">
          Acessar Sistema
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Usuário (Admin)</label>
            <input 
              type="text" 
              id="username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required
              className="mt-1 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
            <input 
              type="password" 
              id="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              className="mt-1 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}