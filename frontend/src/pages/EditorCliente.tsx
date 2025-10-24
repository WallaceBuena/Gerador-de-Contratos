import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api';
import { validaCPF, validaRG, validaCNPJ } from '../utils/validators';
import { formatCPF, formatCNPJ, formatRG } from '../utils/formatters';

export default function EditorCliente() { 
  const [nome, setNome] = useState('');
  const [isPessoaJuridica, setIsPessoaJuridica] = useState(false);
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [endereco, setEndereco] = useState('');
  const [outrosDados, setOutrosDados] = useState('{\n  "nacionalidade": "",\n  "estado_civil": "",\n  "profissao": ""\n}');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      api.get(`/entidades/${id}/`) // Rota nova
        .then(res => {
          const entidade = res.data;
          setNome(entidade.nome);
          setIsPessoaJuridica(entidade.is_pessoa_juridica);
          setCpf(entidade.cpf || '');
          setRg(entidade.rg || '');
          setCnpj(entidade.cnpj || '');
          setEndereco(entidade.endereco || '');
          setOutrosDados(JSON.stringify(entidade.outros_dados || {}, null, 2));
        })
        .catch(err => console.error("Erro ao carregar entidade:", err));
    }
  }, [id]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!nome) newErrors.nome = "Nome/Razão Social é obrigatório.";
    if (isPessoaJuridica) {
        if (!cnpj) newErrors.cnpj = "CNPJ é obrigatório.";
        else if (!validaCNPJ(cnpj)) newErrors.cnpj = "CNPJ inválido.";
    } else {
        if (!cpf) newErrors.cpf = "CPF é obrigatório.";
        else if (!validaCPF(cpf)) newErrors.cpf = "CPF inválido.";
        if (rg && !validaRG(rg)) newErrors.rg = "RG inválido.";
    }
    try {
        if (outrosDados) JSON.parse(outrosDados);
    } catch (e) {
        newErrors.outrosDados = "Formato JSON inválido para 'Outros Dados'.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      alert("Formulário contém erros. Por favor, corrija.");
      return;
    }
    const payload = {
      nome,
      is_pessoa_juridica: isPessoaJuridica,
      cpf: isPessoaJuridica ? null : cpf,
      rg: isPessoaJuridica ? null : rg,
      cnpj: isPessoaJuridica ? cnpj : null,
      endereco,
      outros_dados: outrosDados ? JSON.parse(outrosDados) : {}
    };
    try {
      if (id) {
        await api.put(`/entidades/${id}/`, payload);
      } else {
        await api.post(`/entidades/`, payload);
      }
      alert("Entidade salva com sucesso!");
      navigate('/clientes');
    } catch (err: any) {
      console.error("Erro ao salvar entidade:", err);
      alert(`Erro ao salvar: ${err.response?.data?.cpf || err.response?.data?.cnpj || err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
        {id ? "Editar Entidade" : "Adicionar Nova Entidade"}
      </h1>
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg space-y-6">
        
        <div className="flex justify-center gap-4">
            <button type="button" onClick={() => setIsPessoaJuridica(false)} 
                className={`px-6 py-2 rounded-lg ${!isPessoaJuridica ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                Pessoa Física
            </button>
            <button type="button" onClick={() => setIsPessoaJuridica(true)} 
                className={`px-6 py-2 rounded-lg ${isPessoaJuridica ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                Pessoa Jurídica
            </button>
        </div>

        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700">{isPessoaJuridica ? 'Razão Social' : 'Nome Completo'}</label>
          <input type="text" id="nome" value={nome} onChange={e => setNome(e.target.value)}
                 className={`mt-1 w-full p-2 border rounded-md ${errors.nome ? 'border-red-500' : 'border-gray-300'}`} />
          {errors.nome && <p className="text-xs text-red-600 mt-1">{errors.nome}</p>}
        </div>

        {!isPessoaJuridica && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">CPF</label>
                <input type="text" id="cpf" value={cpf} onChange={e => setCpf(formatCPF(e.target.value))}
                       className={`mt-1 w-full p-2 border rounded-md ${errors.cpf ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.cpf && <p className="text-xs text-red-600 mt-1">{errors.cpf}</p>}
              </div>
              <div>
                <label htmlFor="rg" className="block text-sm font-medium text-gray-700">RG</label>
                <input type="text" id="rg" value={rg} onChange={e => setRg(formatRG(e.target.value))}
                       className={`mt-1 w-full p-2 border rounded-md ${errors.rg ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.rg && <p className="text-xs text-red-600 mt-1">{errors.rg}</p>}
              </div>
            </div>
        )}
        
        {isPessoaJuridica && (
            <div>
              <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">CNPJ</label>
              <input type="text" id="cnpj" value={cnpj} onChange={e => setCnpj(formatCNPJ(e.target.value))}
                     className={`mt-1 w-full p-2 border rounded-md ${errors.cnpj ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.cnpj && <p className="text-xs text-red-600 mt-1">{errors.cnpj}</p>}
            </div>
        )}

        <div>
          <label htmlFor="endereco" className="block text-sm font-medium text-gray-700">Endereço (ViaCEP preencherá)</label>
          <input type="text" id="endereco" value={endereco} onChange={e => setEndereco(e.target.value)}
                 className="mt-1 w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label htmlFor="outrosDados" className="block text-sm font-medium text-gray-700">
            Outros Dados (JSON - ex: {`{"nacionalidade": "Brasileiro"}`} )
          </label>
          <textarea id="outrosDados" value={outrosDados} onChange={e => setOutrosDados(e.target.value)}
                    className={`mt-1 w-full p-2 border rounded-md font-mono ${errors.outrosDados ? 'border-red-500' : 'border-gray-300'}`}
                    rows={5} />
          {errors.outrosDados && <p className="text-xs text-red-600 mt-1">{errors.outrosDados}</p>}
        </div>

        <div className="flex justify-end gap-4">
          <Link to="/clientes" className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400">
            Cancelar
          </Link>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            Salvar Entidade
          </button>
        </div>
      </form>
    </div>
  );
}