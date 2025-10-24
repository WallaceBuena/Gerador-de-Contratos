import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importa o hook de autenticação

export default function Configuracoes() {
  const { logout } = useAuth(); // Pega a função de logout

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Configurações</h1>
        <Link to="/" className="text-blue-500 hover:underline">Voltar ao Dashboard</Link>
      </header>
      
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">Gerenciamento da Conta</h2>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Perfil</h3>
          <p className="text-gray-600">Usuário: (Seu email)</p>
          {/* Campos para "CRIAR EDITAR VISUALIZAR" o perfil do usuário irão aqui */}
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900">Sessão</h3>
          <button
            onClick={logout} // Botão de Logout
            className="w-full bg-red-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-red-700 transition-colors"
          >
            Logout (Sair)
          </button>
        </div>
        
        <hr />
        
        <h2 className="text-2xl font-semibold text-gray-800">Gerenciamento do Sistema</h2>
        <div className="space-y-4">
          <Link to="/biblioteca" className="block w-full text-center bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300">
            Gerenciar Biblioteca de Cláusulas
          </Link>
          <Link to="/clientes" className="block w-full text-center bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300">
            Gerenciar Arquivo Base (Entidades)
          </Link>
          <button className="w-full text-center bg-gray-100 text-gray-400 px-4 py-3 rounded-lg cursor-not-allowed">
            Gerenciar Tipos de Contrato (Em breve)
          </button>
        </div>
      </div>
    </div>
  );
}