import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useNavigate, useParams, Link } from 'react-router-dom';

declare const mammoth: any; // Para importação de DOCX

export default function EditorClausula() {
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [requerAnexo, setRequerAnexo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      api.get(`/clausulas/${id}/`)
        .then(res => {
          setTitulo(res.data.titulo);
          setConteudo(res.data.conteudo_padrao);
          setRequerAnexo(res.data.requer_anexo);
        })
        .catch(err => console.error("Erro ao carregar cláusula:", err))
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const handleImportText = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.docx') && (window as any).mammoth) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (!e.target?.result) return;
            (window as any).mammoth.convertToHtml({ arrayBuffer: e.target.result })
                .then((result: any) => {
                    const div = document.createElement('div');
                    div.innerHTML = result.value;
                    setConteudo(div.innerText || result.value); // Prefere texto puro
                    alert("Texto importado de .docx!");
                })
                .catch(() => alert("Erro ao ler .docx"));
        };
        reader.readAsArrayBuffer(file);
    } else if (file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            setConteudo(e.target?.result as string);
            alert("Texto importado de .txt!");
        };
        reader.readAsText(file);
    } else {
        alert("Formato não suportado. Use .txt ou .docx");
    }
    event.target.value = ''; // Limpa o input
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !conteudo) {
      alert("Título e Conteúdo são obrigatórios.");
      return;
    }
    const payload = {
      titulo: titulo,
      conteudo_padrao: conteudo,
      requer_anexo: requerAnexo,
    };
    try {
      if (id) {
        await api.put(`/clausulas/${id}/`, payload);
      } else {
        await api.post(`/clausulas/`, payload);
      }
      alert("Cláusula salva com sucesso!");
      navigate('/biblioteca');
    } catch (err) {
      console.error("Erro ao salvar cláusula:", err);
      alert("Erro ao salvar cláusula.");
    }
  };

  if (isLoading) return <p>Carregando...</p>;

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{id ? "Editar Cláusula" : "Criar Nova Cláusula"}</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg space-y-6">
        <div>
          <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">Título da Cláusula</label>
          <input type="text" id="titulo" value={titulo} onChange={e => setTitulo(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500" placeholder="Ex: CLÁUSULA 1ª - DO OBJETO" />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="conteudo" className="block text-sm font-medium text-gray-700">Conteúdo</label>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300">
              Importar de .txt ou .docx
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImportText} className="hidden" accept=".txt,.docx" />
          </div>
          <textarea id="conteudo" value={conteudo} onChange={e => setConteudo(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500" rows={15} placeholder="Digite o texto da cláusula aqui..." />
        </div>
        <div className="flex items-center">
          <input type="checkbox" id="requerAnexo" checked={requerAnexo} onChange={e => setRequerAnexo(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
          <label htmlFor="requerAnexo" className="ml-2 block text-sm text-gray-900">
            Esta cláusula exige um anexo?
          </label>
        </div>
        <div className="flex justify-end gap-4">
          <Link to="/biblioteca" className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400">
            Cancelar
          </Link>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            Salvar Cláusula
          </button>
        </div>
      </form>
    </div>
  );
}