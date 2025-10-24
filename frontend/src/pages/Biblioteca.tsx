import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const IconLupa = () => <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>;

interface Clausula {
  id: number;
  titulo: string;
  conteudo_padrao: string;
}

export default function Biblioteca() {
  const [clausulas, setClausulas] = useState<Clausula[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchClausulas();
  }, []);

  const fetchClausulas = () => {
    api.get('/clausulas/')
      .then(res => setClausulas(res.data))
      .catch(err => console.error("Erro ao buscar cláusulas:", err));
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta cláusula?")) {
      try {
        await api.delete(`/clausulas/${id}/`);
        alert("Cláusula excluída com sucesso!");
        fetchClausulas();
      } catch (err) {
        console.error("Erro ao excluir cláusula:", err);
        alert("Erro ao excluir cláusula.");
      }
    }
  };
  
  const filteredClauses = clausulas.filter(c => 
    c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.conteudo_padrao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Biblioteca de Cláusulas
        </h1>
        <div className="flex gap-4">
          <Link to="/" className="text-blue-500 hover:underline flex items-center">
            Voltar ao Dashboard
          </Link>
          <Link to="/editor-clausula" className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-700 transition-colors flex items-center">
            <span className="text-xl mr-2">+</span> Criar Nova Cláusula
          </Link>
        </div>
      </div>
      <div className="mb-6 flex gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <IconLupa />
          </div>
          <input
            type="text"
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Buscar por título ou palavra-chave..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg">
        <ul className="divide-y divide-gray-200">
          {filteredClauses.length === 0 ? (
            <li className="p-6 text-center text-gray-500">Nenhuma cláusula encontrada.</li>
          ) : (
            filteredClauses.map(clausula => (
              <li key={clausula.id} className="p-6 flex justify-between items-center">
                <div className="max-w-2xl">
                  <h3 className="text-lg font-semibold text-gray-900">{clausula.titulo}</h3>
                  <p className="text-gray-600 text-sm truncate">
                    {clausula.conteudo_padrao}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/editor-clausula/${clausula.id}`)}
                    className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(clausula.id)}
                    className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}