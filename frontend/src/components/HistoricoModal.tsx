// frontend/src/components/HistoricoModal.tsx

import React, { useState, useEffect } from 'react';
import api from '../api';

// Interface para os dados do histórico que esperamos da API
interface HistoricoEntry {
  id: number;
  timestamp: string;
  usuario: string; // O username que definimos no __str__
  evento: string;  // O evento (ex: "Criação do Rascunho", "Status alterado...")
}

interface Props {
  rascunhoId: number;
  onClose: () => void;
}

export default function HistoricoModal({ rascunhoId, onClose }: Props) {
  const [historico, setHistorico] = useState<HistoricoEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Busca o histórico do rascunho específico
    api.get(`/rascunhos/${rascunhoId}/historico/`)
      .then(res => {
        setHistorico(res.data);
      })
      .catch(err => {
        console.error("Erro ao buscar histórico:", err);
        setError("Não foi possível carregar o histórico.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [rascunhoId]); // Executa sempre que o rascunhoId mudar

  // Função para formatar a data
  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">Histórico do Rascunho #{rascunhoId}</h2>
        
        <div className="max-h-96 overflow-y-auto border rounded-md p-4">
          {isLoading ? (
            <p className="text-gray-500">A carregar histórico...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : historico.length === 0 ? (
            <p className="text-gray-500">Nenhuma entrada de histórico encontrada.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {historico.map(entry => (
                <li key={entry.id} className="py-3">
                  <p className="text-sm font-medium text-gray-900">
                    {entry.evento}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatTimestamp(entry.timestamp)} por <strong>{entry.usuario}</strong>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button 
          onClick={onClose} 
          className="mt-6 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
