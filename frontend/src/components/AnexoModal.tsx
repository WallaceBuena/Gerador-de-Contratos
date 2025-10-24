import React, { useState, useEffect, useRef } from 'react';
import api from '../api';

interface Anexo {
  id: number;
  nome_arquivo: string;
  arquivo: string; // URL do arquivo
}
interface Props {
  rascunhoId: number;
  onClose: () => void;
  onAnexoSelecionado: (anexo: Anexo) => void;
  clausulaIndex: number | null;
}

export default function AnexoModal({ rascunhoId, onClose, onAnexoSelecionado, clausulaIndex }: Props) {
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAnexos();
  }, [rascunhoId]);

  const fetchAnexos = () => {
    api.get(`/anexos/?rascunho=${rascunhoId}`)
      .then(res => setAnexos(res.data))
      .catch(err => console.error("Erro ao buscar anexos:", err));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('arquivo', file);
    formData.append('rascunho', String(rascunhoId));
    setUploading(true);
    try {
      const res = await api.post(`/anexos/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchAnexos();
      if (clausulaIndex !== null) {
        handleSelecionarAnexo(res.data);
      }
    } catch (err) {
      console.error("Erro no upload:", err);
      alert("Falha no upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleSelecionarAnexo = (anexo: Anexo) => {
    onAnexoSelecionado(anexo);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">Gerenciar Anexos (Rascunho #{rascunhoId})</h2>
        {clausulaIndex !== null && (
            <p className="text-blue-600 bg-blue-100 p-3 rounded-md mb-4">
                Selecione um anexo para vincular à sua nova cláusula, ou adicione um novo.
            </p>
        )}
        <div className="mb-4">
          <button onClick={() => fileInputRef.current?.click()} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600" disabled={uploading}>
            {uploading ? "Enviando..." : "Adicionar Novo Anexo"}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
        </div>
        <div className="max-h-64 overflow-y-auto border rounded-md p-4">
          {anexos.length === 0 ? (
            <p className="text-gray-500">Nenhum anexo encontrado.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {anexos.map(anexo => (
                <li key={anexo.id} className="py-2 flex justify-between items-center">
                  <a href={anexo.arquivo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {anexo.nome_arquivo}
                  </a>
                  {clausulaIndex !== null && (
                    <button 
                      onClick={() => handleSelecionarAnexo(anexo)}
                      className="bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600"
                    >
                      Vincular
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button onClick={onClose} className="mt-6 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400">
          Fechar
        </button>
      </div>
    </div>
  );
}