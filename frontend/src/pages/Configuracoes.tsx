// frontend/src/pages/Configuracoes.tsx
// (FICHIRO MODIFICADO)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

// --- (Copie esta barra de navegação se a sua página não a tiver) ---
// (Ela é igual à do Dashboard.tsx)
const IconSino = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 14h14a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>;
const nomeUsuario = "Analista"; // (Pode vir do AuthContext no futuro)
// --- (Fim da barra de navegação) ---


// Interface para os Templates
interface TemplateQualificacao {
  id: number;
  nome: string;
  is_pessoa_juridica: boolean;
}

// Ícones
const IconPessoaFisica = () => <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>;
const IconPessoaJuridica = () => <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75V4h3.25A2 2 0 0116 6v1H4V6a2 2 0 012-2h3.25V2.75A.75.75 0 0110 2zM3 8v8a2 2 0 002 2h10a2 2 0 002-2V8H3zm3.5 4a.5.5 0 01.5-.5h6a.5.5 0 010 1h-6a.5.5 0 01-.5-.5z" clipRule="evenodd" /></svg>;
const IconEditar = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828zM5 12V7.172l2.586-2.586L10 7.172 7.172 10 5 12zm-2 3a1 1 0 00-1 1v2a1 1 0 001 1h12a1 1 0 001-1v-2a1 1 0 00-1-1H3z" /></svg>;


export default function Configuracoes() {
  const [qualificacoes, setQualificacoes] = useState<TemplateQualificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Busca os templates da API ao carregar a página
  useEffect(() => {
    setLoading(true);
    api.get('/api/qualificacoes/')
      .then(res => {
        setQualificacoes(res.data);
        setErro(null);
      })
      .catch(err => {
        console.error("Erro ao buscar templates:", err);
        setErro("Não foi possível carregar os templates.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);


  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra de Navegação (Copie do Dashboard) */}
      <nav className="bg-white shadow-md fixed w-full z-10">
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <div className="text-xl font-bold text-blue-600">[LOGO]</div>
          <div className="hidden md:flex space-x-6">
            <Link to="/" className="text-gray-500 hover:text-blue-500">Dashboard</Link>
            <Link to="/biblioteca" className="text-gray-500 hover:text-blue-500">Biblioteca</Link>
            <Link to="/clientes" className="text-gray-500 hover:text-blue-500">Entidades (CRM)</Link>
            <Link to="/configuracoes" className="text-gray-700 font-semibold hover:text-blue-500">Configurações</Link>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-500 hover:text-gray-700"><IconSino /></button>
            <div className="flex items-center">
              <img className="w-8 h-8 rounded-full object-cover" src="https://via.placeholder.com/150" alt="Avatar" />
              <span className="ml-2 text-gray-700 font-semibold">{nomeUsuario}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-6 pt-24 pb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Configurações</h1>

        {/* Seção de Templates de Qualificação */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Templates de Qualificação das Partes
            </h2>
            <Link 
              to="/editor-qualificacao" // Link para a nova página de criação
              className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 transition-colors flex items-center text-sm"
            >
              <span className="text-lg mr-1">+</span> Criar Novo Template
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {loading && <p className="p-6 text-gray-500">A carregar templates...</p>}
            {erro && <p className="p-6 text-red-500">{erro}</p>}

            {!loading && !erro && (
              <ul className="divide-y divide-gray-200">
                {qualificacoes.length > 0 ? (
                  qualificacoes.map(template => (
                    <li key={template.id} className="p-4 flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        {template.is_pessoa_juridica ? <IconPessoaJuridica /> : <IconPessoaFisica />}
                        <span className="font-medium text-gray-900">{template.nome}</span>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                          {template.is_pessoa_juridica ? 'Pessoa Jurídica' : 'Pessoa Física'}
                        </span>
                      </div>
                      <Link 
                        to={`/editor-qualificacao/${template.id}`} // Link para a página de edição
                        className="text-gray-500 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100"
                        title="Editar"
                      >
                        <IconEditar />
                      </Link>
                    </li>
                  ))
                ) : (
                  <p className="p-6 text-gray-500 text-center">Nenhum template de qualificação encontrado. Crie o seu primeiro!</p>
                )}
              </ul>
            )}
          </div>
        </section>

        {/* Outras seções de configuração podem vir aqui no futuro */}

      </main>
    </div>
  );
}