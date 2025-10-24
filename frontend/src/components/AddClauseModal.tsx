import React, { useState, useEffect } from 'react';
import api from '../api';

interface Clausula {
  id: number | string;
  titulo: string;
  conteudo_padrao: string;
  requer_anexo?: boolean;
}
interface Props {
  onClose: () => void;
  onClauseAdd: (clausula: Clausula) => void;
}

export default function AddClauseModal({ onClose, onClauseAdd }: Props) {
  const [tab, setTab] = useState<'base' | 'nova'>('base');
  const [baseClauses, setBaseClauses] = useState<Clausula[]>([]);
  const [selectedBaseId, setSelectedBaseId] = useState<string>('');
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoConteudo, setNovoConteudo] = useState('');
  const [novoRequerAnexo, setNovoRequerAnexo] = useState(false);

  useEffect(() => {
    api.get(`/clausulas/`)
      .then(res => setBaseClauses(res.data))
      .catch(err => console.error("Erro ao buscar cláusulas base:", err));
  }, []);

  const handleConfirmAdd = () => {
    if (tab === 'base') {
      const clausulaSelecionada = baseClauses.find(c => c.id === Number(selectedBaseId));
      if (clausulaSelecionada) {
        onClauseAdd(clausulaSelecionada);
      } else {
        alert("Selecione uma cláusula da lista.");
      }
    } else {
      if (!novoTitulo || !novoConteudo) {
        alert("Título e Conteúdo são obrigatórios para uma nova cláusula.");
        return;
      }
      onClauseAdd({
        id: `custom_${Date.now()}`,
        titulo: novoTitulo,
        conteudo_padrao: novoConteudo,
        requer_anexo: novoRequerAnexo,
      });
    }
  };

  return (
    <div id="clausula-modal" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 opacity-100">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl transform scale-100">
        <h3 className="text-xl font-bold mb-4">Adicionar Nova Cláusula</h3>
        <div className="flex border-b mb-4">
          <button onClick={() => setTab('base')} className={`py-2 px-4 ${tab === 'base' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}>
            Selecionar da Biblioteca
          </button>
          <button onClick={() => setTab('nova')} className={`py-2 px-4 ${tab === 'nova' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}>
            Criar Nova
          </button>
        </div>
        {tab === 'base' && (
          <div>
            <label htmlFor="base-clause-select" className="block text-sm font-medium text-gray-700 mb-2">Cláusulas Disponíveis</label>
            <select id="base-clause-select" value={selectedBaseId} onChange={e => setSelectedBaseId(e.target.value)} className="w-full p-2 border rounded-md">
              <option value="">-- Selecione uma cláusula base --</option>
              {baseClauses.map(c => (<option key={c.id} value={c.id}>{c.titulo}</option>))}
            </select>
          </div>
        )}
        {tab === 'nova' && (
          <div className="space-y-4">
            <input type="text" id="new-clause-title" value={novoTitulo} onChange={e => setNovoTitulo(e.target.value)} placeholder="Título da Cláusula (Ex: CLÁUSULA 8ª - DO SIGILO)" className="w-full p-2 border rounded-md" />
            <textarea id="new-clause-content" value={novoConteudo} onChange={e => setNovoConteudo(e.target.value)} placeholder="Conteúdo da cláusula..." className="w-full p-2 border rounded-md h-32" />
            <div className="flex items-center">
              <input type="checkbox" id="novoRequerAnexo" checked={novoRequerAnexo} onChange={e => setNovoRequerAnexo(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <label htmlFor="novoRequerAnexo" className="ml-2 block text-sm text-gray-900">Esta cláusula exige um anexo?</label>
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button id="cancel-add-clause" onClick={onClose} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400">Cancelar</button>
          <button id="confirm-add-clause" onClick={handleConfirmAdd} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Adicionar</button>
        </div>
      </div>
    </div>
  );
}