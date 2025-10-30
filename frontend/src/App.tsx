// frontend/src/App.tsx

import React, { useState, useEffect, useRef } from 'react';
import api from './api';
import './App.css';
import { Link, useParams } from 'react-router-dom';
import { formatCPF, formatCNPJ, formatRG, formatDate } from './utils/formatters';
import AnexoModal from './components/AnexoModal';
import AddClauseModal from './components/AddClauseModal';
import HistoricoModal from './components/HistoricoModal'; // <-- 1. IMPORTAR O NOVO MODAL

declare const html2pdf: any;
declare const mammoth: any;

// --- Interfaces para a NOVA ARQUITETURA ---
interface TipoContrato { id: number; nome: string; partes_requeridas: TipoParte[]; clausulas_base: Clausula[]; }
interface TipoParte { id: number; nome: string; }
interface TemplateQualificacao { id: number; nome: string; is_pessoa_juridica: boolean; template_html: string; variaveis_necessarias: string[]; }
interface Entidade { id: number; nome: string; cpf?: string; rg?: string; cnpj?: string; endereco?: string; outros_dados?: any; }
interface Clausula { id: number | string; titulo: string; conteudo_padrao: string; requer_anexo?: boolean; anexo_id?: number | null; }
// 2. ATUALIZAR INTERFACE RASCUNHO
interface Rascunho {
    id: number;
    titulo_documento: string;
    tipo_contrato: number;
    partes_atribuidas: PartesState;
    variaveis_preenchidas: Record<string, string>;
    clausulas_finais: Clausula[];
    status: 'RASCUNHO' | 'REVISAO' | 'FINALIZADO'; // <-- Status agora é obrigatório
}
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
    const [isHistoricoModalOpen, setIsHistoricoModalOpen] = useState(false); // <-- 3. ADICIONAR ESTADO DO MODAL DE HISTÓRICO
    const [toast, setToast] = useState<{ message: string; visible: boolean; isError: boolean }>({ message: '', visible: false, isError: false });
    
    const { rascunhoId } = useParams<{ rascunhoId: string }>();
    const draggedItem = useRef<number | null>(null);
    const fileImportRef = useRef<HTMLInputElement>(null);

    // 4. ADICIONAR VARIÁVEL DE CONTROLO DE EDIÇÃO
    const isEditingAllowed = currentRascunho?.status === 'RASCUNHO' || !currentRascunho; // Permite edição se for Rascunho ou novo

    // Carregamento inicial (sem alterações)
    useEffect(() => {
        Promise.all([
            api.get('/tipos-contrato/'),
            api.get('/qualificacoes/'),
            api.get('/entidades/')
        ]).then(([tiposRes, qualRes, entRes]) => {
            setTiposContrato(tiposRes.data);
            setTemplatesQualificacao(qualRes.data);
            setEntidades(entRes.data);
            if (rascunhoId) {
                loadRascunho(rascunhoId, tiposRes.data);
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
    // (Sem alterações)
    const handleSelectModelo = (id: string) => { /* ... */ };
    const handleSelectEntidade = (parteNome: string, entidadeId: string) => { /* ... */ };
    const handleSelectQualificacao = (parteNome: string, qualId: string) => { /* ... */ };
    const isStep2Complete = () => { /* ... */ };
    const getRequiredVars = () => { /* ... */ };

    // 5. ATUALIZAR HANDLER DE VARIÁVEIS
    const handleVariableChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!isEditingAllowed) return; // <-- BLOQUEIO DE EDIÇÃO

        const { name, value } = e.target;
        let formattedValue = value;
        
        if (name.includes('cpf')) formattedValue = formatCPF(value);
        if (name.includes('cnpj')) formattedValue = formatCNPJ(value);
        if (name.includes('rg')) formattedValue = formatRG(value);
        
        setVariableValues(prev => ({ ...prev, [name]: formattedValue }));
    };

    // (renderQualificacoesHTML e applyVariables sem alterações)
    const renderQualificacoesHTML = () => { /* ... */ };
    const applyVariables = (html: string) => { /* ... */ };
    
    // --- Lógica de Rascunho, Anexo, Cláusula ---
    // 6. ATUALIZAR SAVE E LOAD
    const handleSaveRascunho = async () => {
        if (!selectedTipoContrato) { showToast("Selecione um modelo.", true); return; }
        const payload = {
            titulo_documento: variableValues['titulo_contrato'] || selectedTipoContrato.nome,
            tipo_contrato: selectedTipoContrato.id,
            partes_atribuidas: partes,
            variaveis_preenchidas: variableValues,
            clausulas_finais: currentClauses,
            status: currentRascunho?.status || 'RASCUNHO', // Mantém o status atual ou define como RASCUNHO
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
            setCurrentRascunho(response.data as Rascunho); // Atualiza o estado
        } catch (error) { showToast("Erro ao salvar.", true); }
    };

    const loadRascunho = async (id: string, tiposContratoData?: TipoContrato[]) => {
        try {
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
            setCurrentRascunho(rascunho); // Define o rascunho (incluindo o status)
            setStep(3);
            showToast(`Rascunho carregado (Status: ${rascunho.status})!`); // Mostra o status
        } catch (err) {
            showToast("Falha ao carregar rascunho.", true);
        }
    };

    // 7. ADICIONAR NOVA FUNÇÃO PARA ATUALIZAR STATUS
    const handleUpdateStatus = async (newStatus: 'RASCUNHO' | 'REVISAO' | 'FINALIZADO') => {
        if (!currentRascunho) {
            showToast("Salve o rascunho primeiro.", true);
            return;
        }
        try {
            // Chama o endpoint PATCH criado no backend
            const response = await api.patch<Rascunho>(`/rascunhos/${currentRascunho.id}/update_status/`, { status: newStatus });
            setCurrentRascunho(response.data); // Atualiza o estado local com a resposta
            showToast(`Status atualizado para ${newStatus}!`);
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            showToast("Falha ao atualizar status.", true);
        }
    };

    const handleAddClause = (clausula: Clausula) => { /* ... (sem alterações) ... */ };
    const handleAnexoSelecionado = (anexo: Anexo) => { /* ... (sem alterações) ... */ };
    
    // --- Lógica de Exportação e Importação ---
    const handleExportPDF = () => { /* ... (sem alterações) ... */ };
    const handleExportDOCX = async () => { /* ... (sem alterações) ... */ };

    // 8. ATUALIZAR IMPORT DOCX
    const handleImportDOCX = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!isEditingAllowed) return; // <-- BLOQUEIO DE EDIÇÃO
        // ... (resto do código)
    };

    const copyToClipboard = () => { /* ... (sem alterações) ... */ };

    // 9. ATUALIZAR HANDLERS DE DRAG AND DROP
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        if (!isEditingAllowed) return; // <-- BLOQUEIO
        draggedItem.current = index;
        setTimeout(() => e.currentTarget.classList.add('clause-dragging'), 0);
    };
    const handleDragEnd = () => { /* ... (sem alterações) ... */ };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        if (!isEditingAllowed) return; // <-- BLOQUEIO
        e.preventDefault();
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
        if (!isEditingAllowed) return; // <-- BLOQUEIO
        // ... (resto do código)
    };
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        if (!isEditingAllowed) return; // <-- BLOQUEIO
        e.preventDefault();
        e.currentTarget.classList.add('clause-drag-over');
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { /* ... (sem alterações) ... */ };
    
    // --- Renderização ---
    const renderVariableForm = () => {
        // ... (código existente) ...
        return varsToFill.map(varName => (
            <div key={varName}>
                <label htmlFor={varName} className="block text-sm font-medium text-gray-700">{varName.replace(/_/g, ' ').toUpperCase()}</label>
                <input 
                    type={varName.includes('data') ? 'date' : 'text'} 
                    id={varName} name={varName}
                    value={variableValues[varName] || ''}
                    onChange={handleVariableChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                    disabled={!isEditingAllowed} // <-- 10. DESABILITAR INPUTS
                />
            </div>
        ));
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            {/* ... (Header e Passos 1 & 2 sem alterações) ... */}

            {/* PASSO 3: EDITOR (O visual do seu index.html) */}
            {step === 3 && (
                 <div className="flex flex-col lg:flex-row gap-8">
                    {/* Painel Esquerdo: Variáveis */}
                    <aside className="w-full lg:w-1/3 bg-white p-6 rounded-xl shadow-lg flex flex-col h-fit">
                        <button onClick={() => setStep(2)} className="text-sm text-blue-500 hover:underline mb-4">&larr; Voltar para Partes</button>
                        <h2 className="text-2xl font-semibold mb-6 border-b pb-3">
                            {/* 11. MOSTRAR STATUS */}
                            Variáveis do Contrato {currentRascunho && `(Status: ${currentRascunho.status})`}
                        </h2>
                        
                        {/* 12. AVISO DE BLOQUEIO */}
                        {!isEditingAllowed && currentRascunho && (
                            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 mb-4 text-sm" role="alert">
                                A edição está bloqueada pois o contrato está em {currentRascunho.status}.
                            </div>
                        )}
                        
                        {/* 13. DESABILITAR INPUTS */}
                        <div className={`space-y-4 ${!isEditingAllowed ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">TÍTULO DO DOCUMENTO</label>
                                <input type="text" name="titulo_contrato" value={variableValues['titulo_contrato'] || selectedTipoContrato?.nome || ''} onChange={handleVariableChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md" disabled={!isEditingAllowed}/>
                            </div>
                            {renderVariableForm()}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">LOCAL E DATA DA ASSINATURA</label>
                                <input type="date" name="data_assinatura" value={variableValues['data_assinatura'] || ''} onChange={handleVariableChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md" disabled={!isEditingAllowed}/>
                            </div>
                        </div>
                    </aside>
                    {/* Painel Direito: Visualização */}
                    <main className="w-full lg:w-2/3">
                        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
                            <div className="flex justify-between items-center mb-6 border-b pb-3 flex-wrap gap-4">
                                <h2 className="text-2xl font-semibold text-gray-900">
                                   Visualização {currentRascunho && `(Status: ${currentRascunho.status})`}
                                </h2>
                                {/* 14. DESABILITAR BOTÕES DE AÇÃO */}
                                <div className="flex gap-2 flex-wrap items-center">
                                    <button onClick={handleSaveRascunho} disabled={!isEditingAllowed}
                                            className="bg-gray-200 text-gray-800 px-3 py-2 text-sm rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {currentRascunho ? "Atualizar Rascunho" : "Salvar Rascunho"}
                                    </button>
                                    <button onClick={() => setIsAddClauseModalOpen(true)} disabled={!isEditingAllowed}
                                            className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                        Adicionar Cláusula
                                    </button>
                                    <button onClick={() => setIsAnexoModalOpen(true)} disabled={!currentRascunho}
                                        className="bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 text-sm disabled:opacity-50">
                                        Gerenciar Anexos
                                    </button>
                                    <button onClick={handleExportPDF} className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 text-sm">Exportar PDF</button>
                                    <button onClick={handleExportDOCX} className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm">Exportar DOCX</button>
                                    <label className={`bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm ${isEditingAllowed ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                                        Importar DOCX
                                        <input type="file" ref={fileImportRef} className="hidden" accept=".docx" onChange={handleImportDOCX} disabled={!isEditingAllowed} />
                                    </label>
                                    <button onClick={copyToClipboard} className="bg-gray-700 text-white px-3 py-2 rounded-lg hover:bg-gray-800 text-sm">Copiar Texto</button>
                                </div>
                            </div>
                            
                            {/* --- 15. NOVOS BOTÕES DE STATUS E HISTÓRICO --- */}
                            {currentRascunho && (
                                <div className="flex justify-between items-center mb-4 border-t pt-4">
                                    <div className="flex gap-2">
                                        {currentRascunho.status === 'RASCUNHO' && (
                                            <button onClick={() => handleUpdateStatus('REVISAO')} className="bg-orange-500 text-white px-3 py-2 text-sm rounded-lg hover:bg-orange-600">
                                                Enviar para Revisão
                                            </button>
                                        )}
                                        {currentRascunho.status === 'REVISAO' && (
                                            <>
                                                <button onClick={() => handleUpdateStatus('FINALIZADO')} className="bg-green-500 text-white px-3 py-2 text-sm rounded-lg hover:bg-green-600">
                                                    Aprovar (Finalizar)
                                                </button>
                                                <button onClick={() => handleUpdateStatus('RASCUNHO')} className="bg-gray-500 text-white px-3 py-2 text-sm rounded-lg hover:bg-gray-600">
                                                    Reverter para Rascunho
                                                </button>
                                            </>
                                        )}
                                        {currentRascunho.status === 'FINALIZADO' && (
                                            <button onClick={() => handleUpdateStatus('RASCUNHO')} className="bg-gray-500 text-white px-3 py-2 text-sm rounded-lg hover:bg-gray-600">
                                                Reverter para Rascunho
                                            </button>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => setIsHistoricoModalOpen(true)}
                                        className="bg-blue-100 text-blue-700 px-3 py-2 text-sm rounded-lg hover:bg-blue-200"
                                    >
                                        Ver Histórico
                                    </button>
                                </div>
                            )}
                            {/* --- FIM DOS BOTÕES DE STATUS E HISTÓRICO --- */}

                            {!currentRascunho && (
                                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                                    <p><strong>Aviso:</strong> Você precisa "Salvar Rascunho" para criar um ID de contrato antes de poder gerenciar anexos.</p>
                                </div>
                            )}
                            
                            {/* 16. ATUALIZAR EDITOR E DRAG/DROP */}
                            <div id="contract-preview-content"
                                 className="prose max-w-none text-justify text-sm leading-relaxed bg-gray-50 border rounded-md p-6 min-h-[600px]"
                                 contentEditable={isEditingAllowed} // Controla edição
                                 suppressContentEditableWarning={true}
                            >
                                <div dangerouslySetInnerHTML={{ __html: applyVariables(MOCK_TEMPLATE.header) }} />
                                <div dangerouslySetInnerHTML={{ __html: renderQualificacoesHTML() }} />
                                
                                <div id="clauses-container" onDragOver={isEditingAllowed ? handleDragOver : undefined}>
                                    {currentClauses.map((clause, index) => (
                                        <div
                                            key={clause.id}
                                            draggable={isEditingAllowed} // Controla draggable
                                            className={`clause p-4 mb-2 border rounded-lg bg-white shadow-sm ${isEditingAllowed ? 'cursor-grab' : ''}`}
                                            onDragStart={isEditingAllowed ? (e) => handleDragStart(e, index) : undefined}
                                            onDragEnd={isEditingAllowed ? handleDragEnd : undefined}
                                            onDrop={isEditingAllowed ? (e) => handleDrop(e, index) : undefined}
                                            onDragEnter={isEditingAllowed ? handleDragEnter : undefined}
                                            onDragLeave={isEditingAllowed ? handleDragLeave : undefined}
                                        >
                                            <h4 className="font-bold mb-2">{applyVariables(clause.titulo.replace(/CLÁUSULA \w+ª/, `CLÁUSULA ${index + 1}ª`))}</h4>
                                            <p dangerouslySetInnerHTML={{ __html: applyVariables(clause.conteudo_padrao) }} />
                                        </div>
                                    ))}
                                    {/* Zona de drop no final */}
                                    <div 
                                        onDragOver={isEditingAllowed ? handleDragOver : undefined} 
                                        onDrop={isEditingAllowed ? (e) => handleDrop(e, currentClauses.length) : undefined} 
                                        onDragEnter={isEditingAllowed ? handleDragEnter : undefined} 
                                        onDragLeave={isEditingAllowed ? handleDragLeave : undefined} 
                                        className="h-10" 
                                    />
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

            {/* 17. RENDERIZAR O MODAL DE HISTÓRICO */}
            {isHistoricoModalOpen && currentRascunho && (
                <HistoricoModal
                    rascunhoId={currentRascunho.id}
                    onClose={() => setIsHistoricoModalOpen(false)}
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
