import { Link, useNavigate } from 'react-router-dom';
import api from '../api'; // Usa a API autenticada
import { useEffect, useState } from 'react';

// Ícones
const IconSino = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 14h14a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>;
const IconDocumento = () => <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

// Interface para o Rascunho (Sprint F)
interface Rascunho {
  id: number;
  titulo_documento: string;
  data_atualizacao: string;
}

export default function Dashboard() {
  const nomeUsuario = "Analista"; // (Pode vir do AuthContext no futuro)
  const [rascunhos, setRascunhos] = useState<Rascunho[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Busca os rascunhos da nova API (Sprint F)
    api.get('/rascunhos/') 
      .then(res => {
        setRascunhos(res.data.slice(0, 5)); // Pega os 5 últimos
      })
      .catch(err => {
        console.error("Erro ao buscar rascunhos:", err);
        // (Aqui pode ter um erro 401 se o login falhou)
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra de Navegação */}
      <nav className="bg-white shadow-md fixed w-full z-10">
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <div className="text-xl font-bold text-blue-600">[LOGO]</div>
          <div className="hidden md:flex space-x-6">
            <Link to="/" className="text-gray-700 font-semibold hover:text-blue-500">Dashboard</Link>
            <Link to="/biblioteca" className="text-gray-500 hover:text-blue-500">Biblioteca</Link>
            <Link to="/clientes" className="text-gray-500 hover:text-blue-500">Entidades (CRM)</Link>
            <Link to="/configuracoes" className="text-gray-500 hover:text-blue-500">Configurações</Link>
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Olá, {nomeUsuario}!</h1>
          <Link to="/editor" className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-700 transition-colors flex items-center">
            <span className="text-xl mr-2">+</span> Criar Novo Contrato
          </Link>
        </div>
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Meus Rascunhos Recentes</h2>
          <div className="bg-white rounded-xl shadow-lg p-4">
            {rascunhos.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {rascunhos.map(rascunho => (
                  <li key={rascunho.id} className="py-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-gray-900 font-medium">{rascunho.titulo_documento}</h3>
                      <span className="text-gray-500 text-sm">editado em {new Date(rascunho.data_atualizacao).toLocaleDateString()}</span>
                    </div>
                    {/* Botão para Carregar Rascunho */}
                    <button 
                      onClick={() => navigate(`/editor/${rascunho.id}`)} // Usa o ID do rascunho
                      className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Continuar
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum rascunho salvo encontrado.</p>
            )}
          </div>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Começar um Novo Contrato</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <Link to="/editor" className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center text-center hover:shadow-xl transition-shadow cursor-pointer">
              <IconDocumento />
              <h3 className="mt-4 font-semibold text-gray-900">Iniciar Novo Documento</h3>
              <p className="text-sm text-gray-500 mt-1">Você selecionará o modelo no editor.</p>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}