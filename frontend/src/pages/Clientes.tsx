import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

interface Entidade {
  id: number;
  nome: string;
  cpf: string;
  cnpj: string;
  is_pessoa_juridica: boolean;
}

export default function Clientes() {
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchEntidades();
  }, []);

  const fetchEntidades = () => {
    api.get('/entidades/') // Usa a nova API de Entidades
      .then(res => setEntidades(res.data))
      .catch(err => console.error("Erro ao buscar entidades:", err));
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta entidade?")) {
      try {
        await api.delete(`/entidades/${id}/`);
        alert("Entidade excluída com sucesso!");
        fetchEntidades();
      } catch (err) {
        console.error("Erro ao excluir entidade:", err);
        alert("Erro ao excluir.");
      }
    }
  };

  const filteredEntidades = entidades.filter(e =>
    e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.cpf && e.cpf.includes(searchTerm)) ||
    (e.cnpj && e.cnpj.includes(searchTerm))
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Arquivo Base (Entidades)</h1>
        <Link to="/" className="text-blue-500 hover:underline">
          Ir para o Dashboard
        </Link>
      </header>
      <div className="flex justify-between items-center mb-6">
        <input
            type="text"
            className="w-full max-w-lg p-3 pl-10 border border-gray-300 rounded-lg shadow-sm"
            placeholder="Buscar por nome, CPF ou CNPJ..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        <Link to="/editor-cliente" className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-700">
          + Adicionar Nova Entidade
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-lg">
        <ul className="divide-y divide-gray-200">
          {filteredEntidades.length === 0 ? (
            <li className="p-6 text-center text-gray-500">Nenhuma entidade encontrada.</li>
          ) : (
            filteredEntidades.map(entidade => (
              <li key={entidade.id} className="p-6 flex justify-between items-center">
                <div className="max-w-2xl">
                  <h3 className="text-lg font-semibold text-gray-900">{entidade.nome}</h3>
                  <p className="text-gray-600 text-sm">
                    {entidade.is_pessoa_juridica ? `CNPJ: ${entidade.cnpj || 'N/A'}` : `CPF: ${entidade.cpf || 'N/A'}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/editor-cliente/${entidade.id}`)}
                    className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(entidade.id)}
                    className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 text-sm"
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