// frontend/src/pages/EditorQualificacao.tsx
// (NOVO FICHEIRO)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api'; // Nosso wrapper do Axios

// Define a interface para o Template de Qualificação
interface TemplateQualificacao {
  id: number;
  nome: string;
  is_pessoa_juridica: boolean;
  template_html: string;
  variaveis_necessarias: string; // O backend espera uma string, vamos tratar no frontend
}

// Ícone para "Voltar"
const IconArrowLeft = () => (
  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
);

export default function EditorQualificacao() {
  const [nome, setNome] = useState('');
  const [isPessoaJuridica, setIsPessoaJuridica] = useState(false);
  const [templateHtml, setTemplateHtml] = useState(
    '<p><b>{{nome_parte}}</b>, nacionalidade {{nacionalidade}}, estado civil {{estado_civil}}, profissão {{profissao}}, portador(a) do RG nº {{rg}} e inscrito(a) no CPF sob o nº {{cpf}}, residente e domiciliado(a) em {{endereco}}.</p>'
  );
  const [variaveis, setVariaveis] = useState('nome_parte, nacionalidade, estado_civil, profissao, rg, cpf, endereco');
  const [erro, setErro] = useState<string | null>(null);
  
  const { id } = useParams<{ id: string }>(); // Pega o ID da URL
  const navigate = useNavigate(); // Para redirecionar após salvar

  // Se um ID existir na URL, busca os dados do template para edição
  useEffect(() => {
    if (id) {
      api.get<TemplateQualificacao>(`/api/qualificacoes/${id}/`)
        .then(res => {
          const data = res.data;
          setNome(data.nome);
          setIsPessoaJuridica(data.is_pessoa_juridica);
          setTemplateHtml(data.template_html);
          // O backend armazena as variáveis como um array de strings.
          // O serializer do Django (provavelmente) converte para string.
          // Vamos assumir que recebemos uma string separada por vírgulas ou um array.
          if (Array.isArray(data.variaveis_necessarias)) {
            setVariaveis(data.variaveis_necessarias.join(', '));
          } else {
            // Se já for uma string (vinda do JSONField ou SerializerMethodField)
            setVariaveis(String(data.variaveis_necessarias || ''));
          }
        })
        .catch(err => {
          console.error("Erro ao buscar template:", err);
          setErro("Não foi possível carregar o template para edição.");
        });
    }
  }, [id]);

  // Função para lidar com a submissão do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    // O backend espera um ARRAY de strings para variaveis_necessarias
    const variaveisArray = variaveis
      .split(',')
      .map(v => v.trim()) // Limpa espaços em branco
      .filter(v => v); // Remove strings vazias

    const payload = {
      nome,
      is_pessoa_juridica: isPessoaJuridica,
      template_html: templateHtml,
      variaveis_necessarias: variaveisArray,
    };

    // Define a promessa da API: PUT se tiver ID (edição), POST se não tiver (criação)
    const apiPromise = id 
      ? api.put(`/api/qualificacoes/${id}/`, payload)
      : api.post('/api/qualificacoes/', payload);

    apiPromise
      .then(() => {
        alert('Template salvo com sucesso!');
        navigate('/configuracoes'); // Volta para a lista
      })
      .catch(err => {
        console.error("Erro ao salvar template:", err.response?.data || err.message);
        setErro('Erro ao salvar. Verifique os campos e tente novamente.');
      });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="container mx-auto max-w-4xl">
        <Link 
          to="/configuracoes" 
          className="inline-flex items-center text-blue-600 hover:underline mb-4"
        >
          <IconArrowLeft />
          Voltar para Configurações
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {id ? 'Editar Template de Qualificação' : 'Criar Novo Template de Qualificação'}
        </h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg space-y-6">
          
          {erro && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
              <p>{erro}</p>
            </div>
          )}

          {/* Nome do Template */}
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Template
            </label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="Ex: Pessoa Física (Completa)"
            />
            <p className="text-xs text-gray-500 mt-1">Um nome descritivo para este template. (Ex: "Pessoa Jurídica (LTDA)")</p>
          </div>

          {/* Tipo (PF ou PJ) */}
          <div className="flex items-center">
            <input
              id="isPessoaJuridica"
              type="checkbox"
              checked={isPessoaJuridica}
              onChange={e => setIsPessoaJuridica(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isPessoaJuridica" className="ml-2 block text-sm font-medium text-gray-900">
              Este template é para Pessoa Jurídica (Empresa)?
            </label>
          </div>

          {/* Variáveis Necessárias */}
          <div>
            <label htmlFor="variaveis" className="block text-sm font-medium text-gray-700 mb-1">
              Variáveis Necessárias (separadas por vírgula)
            </label>
            <input
              id="variaveis"
              type="text"
              value={variaveis}
              onChange={e => setVariaveis(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm"
              placeholder="Ex: nome_parte, cpf, rg, nacionalidade"
            />
            <p className="text-xs text-gray-500 mt-1">
              Liste todas as variáveis (placeholders) que você usará no template abaixo. 
              Use o formato `{{variavel}}`.
            </p>
          </div>

          {/* Template HTML */}
          <div>
            <label htmlFor="templateHtml" className="block text-sm font-medium text-gray-700 mb-1">
              Template HTML
            </label>
            <textarea
              id="templateHtml"
              value={templateHtml}
              onChange={e => setTemplateHtml(e.target.value)}
              required
              rows={10}
              className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm"
              placeholder="<p><b>{{nome_parte}}</b>, inscrito(a) no CPF sob o nº {{cpf}}...</p>"
            />
            <p className="text-xs text-gray-500 mt-1">
              Escreva o bloco de qualificação em HTML. Use as variáveis da lista acima 
              (Ex: `{{nome_parte}}`, `{{cpf}}`, `{{cnpj}}`).
            </p>
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-700 transition-colors"
            >
              Salvar Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}