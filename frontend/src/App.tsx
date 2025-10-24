import React, { useState, useEffect, useRef } from 'react';
import api from './api';
import './App.css';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { formatCPF, formatCNPJ, formatRG, formatDate } from './utils/formatters';
import AnexoModal from './components/AnexoModal';
import AddClauseModal from './components/AddClauseModal';

declare const html2pdf: any;
declare const mammoth: any;

// --- Interfaces para a NOVA ARQUITETURA ---
interface TipoContrato { id: number; nome: string; partes_requeridas: TipoParte[]; clausulas_base: Clausula[]; }
interface TipoParte { id: number; nome: string; }
interface TemplateQualificacao { id: number; nome: string; is_pessoa_juridica: boolean; template_html: string; variaveis_necessarias: string[]; }
interface Entidade { id: number; nome: string; cpf?: string; rg?: string; cnpj?: string; endereco?: string; outros_dados?: any; }
interface Clausula { id: number | string; titulo: string; conteudo_padrao: string; requer_anexo?: boolean; anexo_id?: number | null; }
interface Rascunho { id: number; titulo_documento: string; tipo_contrato: number; partes_atribuidas: PartesState; variaveis_preenchidas: Record<string, string>; clausulas_finais: Clausula[]; }
interface Anexo { id: number; nome_arquivo: string; arquivo: string; }

type ParteAtribuida = {
  entidade: Entidade | null;
  qualificacao: TemplateQualificacao | null;
}
type PartesState = Record<string, ParteAtribuida>;

const MOCK_TEMPLATE = {
    header: `<h3 class="text-center font-bold text-lg mb-6">{{titulo_contrato}}</h3>`,
    footer: `<p class="mt-6 text-center">{{data_assinatura}}</p><div class="mt-16 text-center space-y-8"><div><p class="border-t-2 border-gray-700 w-64 mx-auto pt-2">{{nome_parte_1}}</p><p class="text-xs">{{nome_papel_1}}</p></div><div><p class="border-t-2 border-gray-700 w-64 mx-auto pt-2">{{nome_parte_2}}</p><p class="text-xs">{{nome_papel_2}}</p></div></div>`
};

export default function App() {
    const [step, setStep] = useState(1);
    
    // Dados carregados da API
    const [tiposContrato, setTiposContrato] = useState<TipoContrato[]>([]);
    const [templatesQualificacao, setTemplatesQualificacao] = useState<TemplateQualificacao[]>([]);
    const [entidades, setEntidades] = useState<Entidade[]>([]);
    
    // Estado do Documento
    const [selectedTipoContrato, setSelectedTipoContrato] = useState<TipoContrato | null>(null);
    const [partes, setPartes] = useState<PartesState>({});
    const [currentClauses, setCurrentClauses] = useState<Clausula[]>([]);
    const [variableValues, setVariableValues] = useState<Record<string, string>>({});
    const [currentRascunho, setCurrentRascunho] = useState<Rascunho | null>(null);
    const [clausulaParaAnexar, setClausulaParaAnexar] = useState<number | null>(null);
    
    // UI States
    const [isAnexoModalOpen, setIsAnexoModalOpen] = useState(false);
    const [isAddClauseModalOpen, setIsAddClauseModalOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; visible: boolean; isError: boolean }>({ message: '', visible: false, isError: false });
    
    const { rascunhoId } = useParams<{ rascunhoId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const draggedItem = useRef<number | null>(null);
    const fileImportRef = useRef<HTMLInputElement>(null);

    // Carregamento inicial
    useEffect(() => {
        // Carrega todos os dados base em paralelo
        Promise.all([
            api.get('/tipos-contrato/'),
            api.get('/qualificacoes/'),
            api.get('/entidades/')
        ]).then(([tiposRes, qualRes, entRes]) => {
            setTiposContrato(tiposRes.data);
            setTemplatesQualificacao(qualRes.data);
            setEntidades(entRes.data);
            
            // Se houver um rascunhoId na URL, carrega-o
            if (rascunhoId) {
                loadRascunho(rascunhoId, tiposRes.data); // Passa os tipos já carregados
            }
        }).catch(err => {
            console.error("Erro ao carregar dados iniciais:", err);
            showToast("Falha ao carregar dados do servidor.", true);
        });
    }, [rascunhoId]);
    
    // --- Funções Auxiliares ---
    const showToast = (message: string, isError = false) => {
        setToast({ message, isError, visible: true });
        setTimeout(() => setToast(p => ({ ...p, visible: false })), 3000);
    };

    // --- Lógica do Assistente (Wizard) ---
    const handleSelectModelo = (id: string) => {
        const modelo = tiposContrato.find(m => m.id === Number(id));
        if (modelo) {
            setSelectedTipoContrato(modelo);
            const partesState: PartesState = {};
            modelo.partes_requeridas.forEach(parte => {
                partesState[parte.nome.toLowerCase()] = { entidade: null, qualificacao: null };
            });
            setPartes(partesState);
            setCurrentClauses(modelo.clausulas_base);
            setVariableValues({});
            setCurrentRascunho(null);
            setStep(2);
        }
    };

    const handleSelectEntidade = (parteNome: string, entidadeId: string) => {
        const entidade = entidades.find(e => e.id === Number(entidadeId)) || null;
        setPartes(prev => ({
            ...prev,
            [parteNome]: { ...prev[parteNome], entidade: entidade }
        }));
    };
    
    const handleSelectQualificacao = (parteNome: string, qualId: string) => {
        const qualificacao = templatesQualificacao.find(q => q.id === Number(qualId));
        if (qualificacao) {
            setPartes(prev => ({
                ...prev,
                [parteNome]: { ...prev[parteNome], qualificacao: qualificacao }
            }));
        }
    };

    const isStep2Complete = () => {
        return Object.values(partes).every(p => p.entidade && p.qualificacao);
    };

    const getRequiredVars = () => {
        const allVars = new Set<string>();
        // Adiciona variáveis das qualificações
        Object.values(partes).forEach(p => {
            p.qualificacao?.variaveis_necessarias.forEach(v => allVars.add(v));
        });
        // Adiciona variáveis das cláusulas
        currentClauses.forEach(c => {
            const vars = c.conteudo_padrao.matchAll(/\{\{([\w_]+)\}\}/g) || [];
            [...vars].forEach(match => allVars.add(match[1]));
        });
        return Array.from(allVars);
    }

    const handleVariableChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;
        
        // Aplica formatação ABNT
        if (name.includes('cpf')) formattedValue = formatCPF(value);
        if (name.includes('cnpj')) formattedValue = formatCNPJ(value);
        if (name.includes('rg')) formattedValue = formatRG(value);
        
        setVariableValues(prev => ({ ...prev, [name]: formattedValue }));
    };

    // Renderiza a qualificação final (o bloco de texto)
    const renderQualificacoesHTML = () => {
        let html = '';
        Object.entries(partes).forEach(([nomeParte, data]) => {
            if (data.qualificacao && data.entidade) {
                let bloco = data.qualificacao.template_html;
                
                const entidadeDados: Record<string, string> = {
                    nome: data.entidade.nome || '',
                    cpf: data.entidade.cpf || '',
                    cnpj: data.entidade.cnpj || '',
                    rg: data.entidade.rg || '',
                    endereco: data.entidade.endereco || '',
                    ...(data.entidade.outros_dados || {})
                };

                // Preenche o template de qualificação com os dados da entidade
                for (const [key, value] of Object.entries(entidadeDados)) {
                     bloco = bloco.replace(new RegExp(`{{${key}}}`, 'g'), value || `{{${key}}}`);
                }
                // Preenche com variáveis manuais, se houver
                for (const [key, value] of Object.entries(variableValues)) {
                     bloco = bloco.replace(new RegExp(`{{${key}}}`, 'g'), value || `{{${key}}}`);
                }

                html += `<p class="mb-4"><strong>${nomeParte.toUpperCase()}:</strong> ${bloco}</p>`;
            }
        });
        return html;
    };

    const applyVariables = (html: string) => {
        let processedHtml = html;
        const allValues: Record<string, string> = { ...variableValues };
        
        // Adiciona dados das partes para o rodapé
        const nomesPartes = Object.keys(partes);
        if (nomesPartes[0] && partes[nomesPartes[0]].entidade) {
            allValues['nome_parte_1'] = partes[nomesPartes[0]].entidade!.nome;
            allValues['nome_papel_1'] = nomesPartes[0].toUpperCase();
        }
         if (nomesPartes[1] && partes[nomesPartes[1]].entidade) {
            allValues['nome_parte_2'] = partes[nomesPartes[1]].entidade!.nome;
            allValues['nome_papel_2'] = nomesPartes[1].toUpperCase();
        }
        allValues['titulo_contrato'] = variableValues['titulo_contrato'] || selectedTipoContrato?.nome || "Contrato";

        for (const [key, value] of Object.entries(allValues)) {
            const placeholder = value || `<span class="p-1 bg-blue-100 text-blue-700 rounded-md font-mono text-xs">{{${key}}}</span>`;
            processedHtml = processedHtml.replace(new RegExp(`{{${key}}}`, 'g'), placeholder);
        }
        processedHtml = processedHtml.replace(/{{\s*data_assinatura\s*}}/g, formatDate(variableValues['data_assinatura']) || `{{data_assinatura}}`);

        return processedHtml;
    };
    
    // --- Lógica de Rascunho, Anexo, Cláusula ---
    const handleSaveRascunho = async () => {
        if (!selectedTipoContrato) { showToast("Selecione um modelo.", true); return; }
        const payload = {
            titulo_documento: variableValues['titulo_contrato'] || selectedTipoContrato.nome,
            tipo_contrato: selectedTipoContrato.id,
            partes_atribuidas: partes,
            variaveis_preenchidas: variableValues,
            clausulas_finais: currentClauses,
            status: 'RASCUNHO',
        };
        try {
            let response;
            if (currentRascunho) {
                response = await api.put(`/rascunhos/${currentRascunho.id}/`, payload);
                showToast("Rascunho atualizado!");
            } else {
                response = await api.post(`/rascunhos/`, payload);
                showToast("Rascunho salvo!");
            }
            setCurrentRascunho(response.data);
        } catch (error) { showToast("Erro ao salvar.", true); }
    };

    const loadRascunho = async (id: string, tiposContratoData?: TipoContrato[]) => {
        try {
            // Garante que os dados base estão carregados
            const tipos = tiposContratoData || tiposContrato.length > 0 ? tiposContrato : (await api.get<TipoContrato[]>('/tipos-contrato/')).data;
            if (templatesQualificacao.length === 0) await api.get<TemplateQualificacao[]>('/qualificacoes/').then(res => setTemplatesQualificacao(res.data));
            
            const res = await api.get<Rascunho>(`/rascunhos/${id}/`);
            const rascunho = res.data;
            const modelo = tipos.find(m => m.id === rascunho.tipo_contrato);
            
            if (!modelo) {
                showToast("Tipo de contrato base não encontrado.", true); return;
            }
            
            setSelectedTipoContrato(modelo);
            setPartes(rascunho.partes_atribuidas);
            setCurrentClauses(rascunho.clausulas_finais);
            setVariableValues(rascunho.variaveis_preenchidas);
            setCurrentRascunho(rascunho);
            setStep(3);
            showToast("Rascunho carregado!");
        } catch (err) {
            showToast("Falha ao carregar rascunho.", true);
        }
    };

    const handleAddClause = (clausula: Clausula) => {
        setIsAddClauseModalOpen(false);
        if (clausula.requer_anexo && !currentRascunho) {
            showToast("Salve o rascunho antes de adicionar uma cláusula que requer anexo.", true);
            return;
        }
        if (clausula.requer_anexo) {
            setClausulaParaAnexar(currentClauses.length);
            setIsAnexoModalOpen(true);
            showToast("Selecione ou adicione o anexo para esta cláusula.");
        }
        setCurrentClauses(prev => [...prev, clausula]);
        showToast("Cláusula adicionada!");
    };
    
    const handleAnexoSelecionado = (anexo: Anexo) => {
        if (clausulaParaAnexar !== null) {
            const clausulaModificada = { 
                ...currentClauses[clausulaParaAnexar], 
                anexo_id: anexo.id,
                conteudo_padrao: currentClauses[clausulaParaAnexar].conteudo_padrao + 
                                 `<br><br><strong>(Ver Anexo: ${anexo.nome_arquivo})</strong>`
            };
            const newClauses = [...currentClauses];
            newClauses[clausulaParaAnexar] = clausulaModificada;
            setCurrentClauses(newClauses);
            setClausulaParaAnexar(null);
            showToast(`Anexo "${anexo.nome_arquivo}" vinculado à cláusula.`);
        }
    };
    
    // --- Lógica de Exportação e Importação ---
    const handleExportPDF = () => {
        const preview = document.getElementById('contract-preview-content');
        if (preview && (window as any).html2pdf) {
             const opt = { margin: 1, filename: `${variableValues['titulo_contrato'] || 'contrato'}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } } as any;
             (window as any).html2pdf().set(opt).from(preview).save();
        } else {
            showToast("Erro ao carregar a biblioteca PDF.", true);
        }
    };

    const handleExportDOCX = async () => {
        const preview = document.getElementById('contract-preview-content');
        if (preview) {
            try {
                const response = await api.post(`/export/docx/`, { html: preview.innerHTML }, { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${variableValues['titulo_contrato'] || 'contrato'}.docx`);
                document.body.appendChild(link);
                link.click();
                link.parentNode?.removeChild(link);
            } catch (e) { showToast('Erro ao gerar DOCX. Verifique o console.', true); }
        }
    };
    
    const handleImportDOCX = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && (window as any).mammoth) {
            const reader = new FileReader();
            reader.onload = function(e) {
                if (!e.target?.result) return;
                (window as any).mammoth.convertToHtml({ arrayBuffer: e.target.result })
                    .then((result: any) => {
                        const div = document.createElement('div');
                        div.innerHTML = result.value;
                        const importedClauses: Clausula[] = [];
                        div.querySelectorAll('p').forEach((p, index) => {
                            if (p.innerText.trim()) {
                                importedClauses.push({
                                    id: `imported_${Date.now()}_${index}`,
                                    titulo: `CLÁUSULA ${index + 1}ª (Importada)`,
                                    conteudo_padrao: p.innerHTML
                                });
                            }
                        });
                        setCurrentClauses(importedClauses);
                        setVariableValues(prev => ({ ...prev, titulo_contrato: file.name.replace('.docx', '') }));
                        showToast("Documento importado! Verifique as cláusulas.");
                    })
                    .catch(() => showToast("Erro ao importar o arquivo DOCX.", true));
            };
            reader.readAsArrayBuffer(file);
            event.target.value = '';
        } else if (!(window as any).mammoth) {
             showToast("Biblioteca de importação 'mammoth.js' não foi carregada.", true);
        }
    };

    const copyToClipboard = () => {
        const preview = document.getElementById('contract-preview-content');
        if (preview) {
            navigator.clipboard.writeText(preview.innerText)
                .then(() => showToast('Texto do contrato copiado!'))
                .catch(() => showToast('Falha ao copiar texto.', true));
        }
    };

    // --- Handlers de Drag and Drop (do seu index.html) ---
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        draggedItem.current = index;
        setTimeout(() => e.currentTarget.classList.add('clause-dragging'), 0);
    };
    const handleDragEnd = () => {
        draggedItem.current = null;
        document.querySelectorAll('.clause-dragging').forEach(el => el.classList.remove('clause-dragging'));
        document.querySelectorAll('.clause-drag-over').forEach(el => el.classList.remove('clause-drag-over'));
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
        e.preventDefault();
        e.currentTarget.classList.remove('clause-drag-over');
        if (draggedItem.current === null || draggedItem.current === targetIndex) {
            draggedItem.current = null;
            return;
        }
        
        const newClauses = [...currentClauses];
        const draggedClause = newClauses.splice(draggedItem.current, 1)[0];
        // Corrige a lógica de índice ao arrastar para baixo
        if (draggedItem.current < targetIndex) {
            newClauses.splice(targetIndex - 1, 0, draggedClause);
        } else {
            newClauses.splice(targetIndex, 0, draggedClause);
        }
        
        setCurrentClauses(newClauses);
        draggedItem.current = null;
    };
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.currentTarget.classList.add('clause-drag-over'); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.currentTarget.classList.remove('clause-drag-over'); };
    
    // --- Renderização ---
    
    // Renderiza o formulário de variáveis dinamicamente
    const renderVariableForm = () => {
        const requiredVars = getRequiredVars();
        // Filtra variáveis que já são preenchidas pelas entidades ou são de data/título
        const varsToFill = requiredVars.filter(v => 
            !v.startsWith('nome') && !v.startsWith('cpf') && !v.startsWith('rg') &&
            !v.startsWith('cnpj') && !v.startsWith('endereco') && 
            !v.startsWith('nacionalidade') && !v.startsWith('estado_civil') && !v.startsWith('profissao') &&
            v !== 'titulo_contrato' && v !== 'data_assinatura'
        );

        if (varsToFill.length === 0) {
            return <p className="text-sm text-gray-500">Nenhuma variável adicional necessária.</p>;
        }

        return varsToFill.map(varName => (
            <div key={varName}>
                <label htmlFor={varName} className="block text-sm font-medium text-gray-700">{varName.replace(/_/g, ' ').toUpperCase()}</label>
                <input 
                    type={varName.includes('data') ? 'date' : 'text'} 
                    id={varName} name={varName}
                    value={variableValues[varName] || ''}
                    onChange={handleVariableChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                />
            </div>
        ));
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900">Editor de Contratos</h1>
                <Link to="/" className="text-blue-500 hover:underline">Voltar ao Dashboard</Link>
            </header>

            {/* PASSO 1: SELECIONAR MODELO */}
            {step === 1 && (
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-semibold mb-6">Passo 1: Selecione o Tipo de Contrato</h2>
                    <select 
                        onChange={e => handleSelectModelo(e.target.value)} 
                        defaultValue=""
                        className="w-full p-3 border border-gray-300 rounded-md"
                    >
                        <option value="" disabled>-- Escolha um modelo --</option>
                        {tiposContrato.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                    </select>
                </div>
            )}

            {/* PASSO 2: CONFIGURAR PARTES */}
            {step === 2 && selectedTipoContrato && (
                <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-semibold mb-6">Passo 2: Defina as Partes ({selectedTipoContrato.nome})</h2>
                    <button onClick={() => setStep(1)} className="text-sm text-blue-500 hover:underline mb-4">&larr; Voltar</button>
                    <div className="space-y-6">
                        {Object.keys(partes).map(parteNome => (
                            <div key={parteNome} className="p-4 border rounded-md bg-gray-50">
                                <h3 className="text-xl font-bold text-blue-600 mb-3">{parteNome.toUpperCase()}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Arquivo Base (CRM)</label>
                                        <select 
                                            onChange={(e) => handleSelectEntidade(parteNome, e.target.value)}
                                            className="w-full p-2 border rounded-md"
                                        >
                                            <option value="">-- Buscar Entidade --</option>
                                            {entidades.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                                        </select>
                                        <Link to="/editor-cliente" target="_blank" className="text-xs text-blue-500 hover:underline mt-1">Adicionar nova entidade</Link>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Qualificação</label>
                                        <select 
                                            onChange={(e) => handleSelectQualificacao(parteNome, e.target.value)}
                                            className="w-full p-2 border rounded-md"
                                        >
                                            <option value="">-- Selecione a Qualificação --</option>
                                            {templatesQualificacao.map(q => <option key={q.id} value={q.id}>{q.nome}</option>)}
                                        </select>
                                    </div>
                                </div>
                                {partes[parteNome].entidade && <p className="text-sm text-green-600 mt-2">✔ Entidade: {partes[parteNome].entidade?.nome}</p>}
                                {partes[parteNome].qualificacao && <p className="text-sm text-green-600 mt-1">✔ Qualificação: {partes[parteNome].qualificacao?.nome}</p>}
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={() => setStep(3)} 
                        disabled={!isStep2Complete()}
                        className="w-full mt-6 bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-700 disabled:opacity-50"
                    >
                        Avançar para o Editor
                    </button>
                </div>
            )}
            
            {/* PASSO 3: EDITOR (O visual do seu index.html) */}
            {step === 3 && (
                 <div className="flex flex-col lg:flex-row gap-8">
                    {/* Painel Esquerdo: Variáveis */}
                    <aside className="w-full lg:w-1/3 bg-white p-6 rounded-xl shadow-lg flex flex-col h-fit">
                        <button onClick={() => setStep(2)} className="text-sm text-blue-500 hover:underline mb-4">&larr; Voltar para Partes</button>
                        <h2 className="text-2xl font-semibold mb-6 border-b pb-3">Variáveis do Contrato</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">TÍTULO DO DOCUMENTO</label>
                                <input type="text" name="titulo_contrato" value={variableValues['titulo_contrato'] || selectedTipoContrato?.nome || ''} onChange={handleVariableChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
                            </div>
                            {renderVariableForm()}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">LOCAL E DATA DA ASSINATURA</label>
                                <input type="date" name="data_assinatura" value={variableValues['data_assinatura'] || ''} onChange={handleVariableChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md" />
                            </div>
                        </div>
                    </aside>
                    {/* Painel Direito: Visualização */}
                    <main className="w-full lg:w-2/3">
                        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
                            <div className="flex justify-between items-center mb-6 border-b pb-3 flex-wrap gap-4">
                                <h2 className="text-2xl font-semibold text-gray-900">Visualização</h2>
                                <div className="flex gap-2 flex-wrap">
                                    <button onClick={handleSaveRascunho} className="bg-gray-200 text-gray-800 px-3 py-2 text-sm rounded-lg hover:bg-gray-300">{currentRascunho ? "Atualizar Rascunho" : "Salvar Rascunho"}</button>
                                    <button onClick={() => setIsAddClauseModalOpen(true)} className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm">Adicionar Cláusula</button>
                                    <button onClick={handleExportPDF} className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 text-sm">Exportar PDF</button>
                                    <button onClick={handleExportDOCX} className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm">Exportar DOCX</button>
                                    <label className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm cursor-pointer">
                                        Importar DOCX
                                        <input type="file" ref={fileImportRef} className="hidden" accept=".docx" onChange={handleImportDOCX} />
                                    </label>
                                    <button onClick={copyToClipboard} className="bg-gray-700 text-white px-3 py-2 rounded-lg hover:bg-gray-800 text-sm">Copiar Texto</button>
                                    <button onClick={() => setIsAnexoModalOpen(true)} disabled={!currentRascunho}
                                        className="bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 text-sm disabled:opacity-50">
                                        Gerenciar Anexos
                                    </button>
                                </div>
                            </div>
                            {!currentRascunho && (
                                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                                    <p><strong>Aviso:</strong> Você precisa "Salvar Rascunho" para criar um ID de contrato antes de poder gerenciar anexos.</p>
                                </div>
                            )}
                            <div id="contract-preview-content" className="prose max-w-none text-justify text-sm leading-relaxed bg-gray-50 border rounded-md p-6 min-h-[600px]" contentEditable="true" suppressContentEditableWarning={true}>
                                <div dangerouslySetInnerHTML={{ __html: applyVariables(MOCK_TEMPLATE.header) }} />
                                <div dangerouslySetInnerHTML={{ __html: renderQualificacoesHTML() }} />
                                
                                <div id="clauses-container" onDragOver={handleDragOver}>
                                    {currentClauses.map((clause, index) => (
                                        <div
                                            key={clause.id}
                                            draggable="true"
                                            className="clause p-4 mb-2 border rounded-lg bg-white shadow-sm"
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragEnd={handleDragEnd}
                                            onDrop={(e) => handleDrop(e, index)}
                                            onDragEnter={handleDragEnter}
                                            onDragLeave={handleDragLeave}
                                        >
                                            <h4 className="font-bold mb-2">{applyVariables(clause.titulo.replace(/CLÁUSULA \w+ª/, `CLÁUSULA ${index + 1}ª`))}</h4>
                                            <p dangerouslySetInnerHTML={{ __html: applyVariables(clause.conteudo_padrao) }} />
                                        </div>
                                    ))}
                                    {/* Zona de drop no final */}
                                    <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, currentClauses.length)} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} className="h-10" />
                               </div>
                                <div dangerouslySetInnerHTML={{ __html: applyVariables(MOCK_TEMPLATE.footer) }} />
                            </div>
                        </div>
                    </main>
                 </div>
            )}

            {/* Modais */}
            {isAnexoModalOpen && currentRascunho && (
                <AnexoModal
                    rascunhoId={currentRascunho.id}
                    onClose={() => { setIsAnexoModalOpen(false); setClausulaParaAnexar(null); }}
                    onAnexoSelecionado={handleAnexoSelecionado}
                    clausulaIndex={clausulaParaAnexar}
                />
            )}
            {isAddClauseModalOpen && (
                <AddClauseModal
                    onClose={() => setIsAddClauseModalOpen(false)}
                    onClauseAdd={handleAddClause}
                />
            )} 

            {/* Toast */}
            {toast.visible && (
                <div id="toast" className={`fixed bottom-10 right-10 ${toast.isError ? 'bg-red-500' : 'bg-green-500'} text-white px-6 py-3 rounded-lg shadow-xl ${toast.visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-[150%]'}`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}