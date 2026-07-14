import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { AlertTriangle, ArrowLeft, Truck, Car, DollarSign, Gift } from "lucide-react";

interface CarregamentoItem {
  produtoId: Id<"produtos">;
  produtoNome: string;
  unidade: string;
  saborId?: Id<"sabores">;
  saborNome?: string;
  formatoPacoteId?: Id<"formatos_pacote">;
  formatoNome?: string;
  quantidade: number;
}

export default function Lancamentos() {
  const [, setLocation] = useLocation();
  const params = useParams<{ tipo: "producao" | "carregamento" | "perda" }>();
  const flow = params.tipo;

  // Credenciais da sessão do colaborador
  const token = localStorage.getItem("colab_token") || "";
  const camaraId = (localStorage.getItem("colab_camara_id") || "") as Id<"camaras">;
  const camaraNome = localStorage.getItem("colab_camara_nome") || "";
  const camaraSlug = localStorage.getItem("colab_camara_slug") || "";

  // Validar sessão ativa
  const sessaoValidada = useQuery(
    api.operadores.validarSessao,
    token && camaraId ? { token, camaraId } : "skip"
  );

  useEffect(() => {
    if (sessaoValidada === null) {
      localStorage.clear();
      setLocation(`/colaborador/login${camaraSlug ? `?camara=${camaraSlug}` : ""}`);
    }
  }, [sessaoValidada, setLocation, camaraSlug]);

  // Queries para formulários
  const produtos = useQuery(api.cadastros.listarProdutosAtivos);
  const sabores = useQuery(api.cadastros.listarSaboresAtivos);
  const formatos = useQuery(api.cadastros.listarFormatosPacoteAtivos);
  const veiculos = useQuery(api.cadastros.listarVeiculosAtivos);
  const motivosPerda = useQuery(api.cadastros.listarMotivosPerdaAtivos);
  const clientes = useQuery(api.cadastros.listarClientesAtivos);
  const saldosCamara = useQuery(api.estoque.obterSaldosCamara, camaraId ? { camaraId } : "skip");

  // Helpers para obter saldos em lote
  const getProductTotalSaldo = (prodId: string) => {
    if (!saldosCamara) return 0;
    let total = 0;
    Object.entries(saldosCamara).forEach(([key, val]) => {
      if (key === prodId || key.startsWith(`${prodId}_`)) {
        total += val as number;
      }
    });
    return total;
  };

  const getSaborSaldo = (prodId: string, saborId: string) => {
    return saldosCamara?.[`${prodId}_${saborId}`] ?? 0;
  };

  const getFormatoSaldo = (prodId: string, formatoId: string) => {
    return saldosCamara?.[`${prodId}_${formatoId}`] ?? 0;
  };

  // Mutations
  const lancarProducaoMutation = useMutation(api.estoque.lancarProducao);
  const lancarPerdaMutation = useMutation(api.estoque.lancarPerda);
  const lancarCarregamentoMutation = useMutation(api.estoque.lancarCarregamento);

  // Wizard state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Common Selection states
  const [selectedProduto, setSelectedProduto] = useState<Doc<"produtos"> | null>(null);
  const [selectedSabor, setSelectedSabor] = useState<Doc<"sabores"> | null>(null);
  const [selectedFormato, setSelectedFormato] = useState<Doc<"formatos_pacote"> | null>(null);
  const [selectedMotivo, setSelectedMotivo] = useState<Doc<"motivos_perda"> | null>(null);
  const [quantidadeStr, setQuantidadeStr] = useState("");
  const [observacao, setObservacao] = useState("");

  // Query Saldo do Item Selecionado (Reativo)
  const saldoDisponivel = useQuery(
    api.estoque.consultarSaldoEstoque,
    selectedProduto && camaraId
      ? {
          camaraId,
          produtoId: selectedProduto._id,
          saborId: selectedSabor?._id,
          formatoPacoteId: selectedFormato?._id,
        }
      : "skip"
  );

  // Carregamento states
  const [tipoCarregamento, setTipoCarregamento] = useState<"venda" | "patrocinio">("venda");
  const [evento, setEvento] = useState("");
  const [motorista, setMotorista] = useState("");
  const [veiculoTipo, setVeiculoTipo] = useState<"proprio" | "terceiro">("proprio");
  const [selectedVeiculo, setSelectedVeiculo] = useState<Doc<"veiculos"> | null>(null);
  const [terceiroPlaca, setTerceiroPlaca] = useState("");
  const [terceiroDescricao, setTerceiroDescricao] = useState("");
  const [itensCarregamento, setItensCarregamento] = useState<CarregamentoItem[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<string>("");
  const [clienteNomeAvulso, setClienteNomeAvulso] = useState<string>("");

  // Sub-wizard item selection inside Carregamento
  const [subStep, setSubStep] = useState(0); // 0 = listando itens, 1 = prod, 2 = sabor/formato, 3 = quantidade

  // Helper para determinar se produto precisa de sabor
  const produtoPrecisaSabor = (prod: Doc<"produtos">) => {
    return prod.nome.toLowerCase().includes("saborizado");
  };

  // Helper para determinar se produto precisa de formato
  const produtoPrecisaFormato = (prod: Doc<"produtos">) => {
    return prod.unidade === "pacote" && !prod.nome.toLowerCase().includes("saborizado");
  };

  // Teclado numérico
  const handleKeypadPress = (num: string) => {
    setQuantidadeStr((prev) => prev + num);
  };
  const handleKeypadDelete = () => {
    setQuantidadeStr((prev) => prev.slice(0, -1));
  };
  const handleKeypadClear = () => {
    setQuantidadeStr("");
  };

  // Navegação para trás
  const handleBack = () => {
    setError(null);
    if (flow === "producao" || flow === "perda") {
      if (step === 2) {
        setStep(1);
        setSelectedProduto(null);
      } else if (step === 3) {
        if (produtoPrecisaSabor(selectedProduto!) || produtoPrecisaFormato(selectedProduto!)) {
          setStep(2);
        } else {
          setStep(1);
          setSelectedProduto(null);
        }
        setSelectedSabor(null);
        setSelectedFormato(null);
      } else if (step === 4) {
        if (flow === "perda") {
          setStep(3); // volta pro motivo
        } else {
          setStep(3); // volta pro keypad de qtd
        }
        setQuantidadeStr("");
      } else if (step === 5 && flow === "perda") {
        setStep(4);
      }
    } else if (flow === "carregamento") {
      if (subStep > 0) {
        // Cancelar sub-wizard de item e voltar pra lista
        if (subStep === 1) {
          setSubStep(0);
          setSelectedProduto(null);
        } else if (subStep === 2) {
          setSubStep(1);
          setSelectedProduto(null);
          setSelectedSabor(null);
          setSelectedFormato(null);
        } else if (subStep === 3) {
          if (produtoPrecisaSabor(selectedProduto!) || produtoPrecisaFormato(selectedProduto!)) {
            setSubStep(2);
          } else {
            setSubStep(1);
            setSelectedProduto(null);
          }
          setQuantidadeStr("");
        }
      } else {
        if (step > 1) setStep(step - 1);
        else setLocation("/colaborador/painel");
      }
    }
  };

  // Submissão do item de Carregamento
  const handleConfirmCarregamentoItem = () => {
    const quantidadeVal = parseFloat(quantidadeStr);
    if (isNaN(quantidadeVal) || quantidadeVal <= 0) {
      setError("Digite uma quantidade maior que zero.");
      return;
    }

    if (saldoDisponivel !== undefined && saldoDisponivel < quantidadeVal) {
      setError(`Saldo insuficiente! Estoque disponível nesta câmara: ${saldoDisponivel}`);
      return;
    }

    const novoItem: CarregamentoItem = {
      produtoId: selectedProduto!._id,
      produtoNome: selectedProduto!.nome,
      unidade: selectedProduto!.unidade,
      saborId: selectedSabor?._id,
      saborNome: selectedSabor?.nome,
      formatoPacoteId: selectedFormato?._id,
      formatoNome: selectedFormato?.nome,
      quantidade: quantidadeVal,
    };

    setItensCarregamento((prev) => [...prev, novoItem]);

    // Resetar sub-wizard do item
    setSubStep(0);
    setSelectedProduto(null);
    setSelectedSabor(null);
    setSelectedFormato(null);
    setQuantidadeStr("");
    setError(null);
  };

  const handleRemoveCarregamentoItem = (index: number) => {
    setItensCarregamento((prev) => prev.filter((_, i) => i !== index));
  };

  // Gravar Lançamentos no Banco
  const handleGravar = async () => {
    setLoading(true);
    setError(null);
    try {
      const quantidadeVal = parseFloat(quantidadeStr);

      if (flow === "producao") {
        await lancarProducaoMutation({
          token,
          camaraId,
          produtoId: selectedProduto!._id,
          saborId: selectedSabor?._id || undefined,
          formatoPacoteId: selectedFormato?._id || undefined,
          quantidade: quantidadeVal,
        });
      } else if (flow === "perda") {
        await lancarPerdaMutation({
          token,
          camaraId,
          produtoId: selectedProduto!._id,
          saborId: selectedSabor?._id || undefined,
          formatoPacoteId: selectedFormato?._id || undefined,
          quantidade: quantidadeVal,
          motivoPerdaId: selectedMotivo!._id,
          observacao: observacao || undefined,
        });
      } else if (flow === "carregamento") {
        const payloadClienteId = (tipoCarregamento === "venda" && selectedClienteId !== "avulso" && selectedClienteId) ? (selectedClienteId as Id<"clientes">) : undefined;
        const payloadClienteNome = (tipoCarregamento === "venda") 
          ? (selectedClienteId === "avulso" ? clienteNomeAvulso.trim() : (clientes?.find(c => c._id === selectedClienteId)?.nome || undefined))
          : undefined;

        await lancarCarregamentoMutation({
          token,
          camaraId,
          tipo: tipoCarregamento,
          evento: tipoCarregamento === "patrocinio" ? evento : undefined,
          veiculoId: veiculoTipo === "proprio" ? selectedVeiculo?._id : undefined,
          veiculoPlaca: veiculoTipo === "terceiro" ? terceiroPlaca : undefined,
          veiculoDescricao: veiculoTipo === "terceiro" ? terceiroDescricao : undefined,
          motorista,
          clienteId: payloadClienteId,
          clienteNome: payloadClienteNome,
          itens: itensCarregamento.map((it) => ({
            produtoId: it.produtoId,
            saborId: it.saborId,
            formatoPacoteId: it.formatoPacoteId,
            quantidade: it.quantidade,
          })),
        });
      }

      // Redireciona de volta ao painel principal em caso de sucesso
      setLocation("/colaborador/painel");
    } catch (err: any) {
      setError(err.message || "Erro ao gravar o lançamento.");
    } finally {
      setLoading(false);
    }
  };

  if (sessaoValidada === undefined) {
    return (
      <div className="min-h-screen bg-bg-glacial flex items-center justify-center p-6 text-center font-sans">
        <div className="text-sm text-ink-secondary">Carregando dados da sessão...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-glacial font-sans flex flex-col justify-between py-6 px-4">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-between">
        
        {/* Top bar de navegação / Status */}
        <div className="flex items-center justify-between mb-6 bg-surface-card px-4 py-3.5 rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial">
          <button
            onClick={handleBack}
            className="text-xs text-brand-primary font-bold hover:underline cursor-pointer flex items-center space-x-1.5 min-h-[44px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar</span>
          </button>
          
          <div className="text-right">
            <span className="text-[9px] text-ink-secondary block font-mono uppercase tracking-wider">CÂMARA ATIVA</span>
            <span className="text-xs font-bold text-ink-primary block">{camaraNome}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-brand-error-bg text-brand-error border border-[rgba(201,58,66,0.15)] rounded-glacial text-xs font-semibold text-left flex items-start">
            <AlertTriangle className="w-4 h-4 text-brand-error mr-2 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ==========================================
           WIZARD FLOW: PRODUÇÃO E PERDA
           ========================================== */}
        {(flow === "producao" || flow === "perda") && (
          <div className="flex-1 flex flex-col justify-between bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial p-6">
            
            {/* Step 1: Escolha do Produto */}
            {step === 1 && (
              <div className="flex-1 flex flex-col">
                <h2 className="text-sm font-bold text-ink-primary mb-4 text-left">Passo 1: Selecione o Produto</h2>
                <div className="space-y-2 flex-1 overflow-y-auto max-h-[350px] pr-1">
                  {produtos?.map((prod) => {
                    const saldoTotal = getProductTotalSaldo(prod._id);
                    return (
                      <button
                        key={prod._id}
                        onClick={() => {
                          setSelectedProduto(prod);
                          if (produtoPrecisaSabor(prod) || produtoPrecisaFormato(prod)) {
                            setStep(2);
                          } else {
                            setStep(3);
                          }
                        }}
                        className="w-full text-left bg-bg-glacial border border-[rgba(91,112,120,0.12)] hover:border-brand-primary active:bg-[rgba(14,124,156,0.05)] rounded-glacial px-4 py-4 text-sm font-bold text-ink-primary transition-all flex items-center justify-between cursor-pointer min-h-[56px]"
                      >
                        <div className="flex flex-col text-left">
                          <span>{prod.nome}</span>
                          <span className="text-[10px] text-ink-secondary font-normal font-mono mt-0.5">
                            Saldo: {saldosCamara !== undefined ? `${saldoTotal.toLocaleString("pt-BR")} ${prod.unidade}s` : "Carregando..."}
                          </span>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-ink-secondary border border-[rgba(91,112,120,0.1)] shrink-0 self-center">
                          {prod.unidade}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Escolha do Sabor ou Formato */}
            {step === 2 && selectedProduto && (
              <div className="flex-1 flex flex-col">
                <h2 className="text-sm font-bold text-ink-primary mb-4 text-left">
                  Passo 2: Selecione o {produtoPrecisaSabor(selectedProduto) ? "Sabor" : "Formato de Pacote"}
                </h2>
                
                {/* Lista de Sabores */}
                {produtoPrecisaSabor(selectedProduto) && (
                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[350px] pr-1">
                    {sabores?.map((sab) => {
                      const saldo = getSaborSaldo(selectedProduto._id, sab._id);
                      return (
                        <button
                          key={sab._id}
                          onClick={() => {
                            setSelectedSabor(sab);
                            setStep(3);
                          }}
                          className="w-full text-left bg-bg-glacial border border-[rgba(91,112,120,0.12)] hover:border-brand-primary active:bg-[rgba(14,124,156,0.05)] rounded-glacial px-4 py-4 text-sm font-bold text-ink-primary cursor-pointer min-h-[56px] flex items-center justify-between"
                        >
                          <span>🍉 {sab.nome}</span>
                          <span className="text-[10px] font-semibold font-mono text-ink-secondary">
                            Disponível: {saldosCamara !== undefined ? `${saldo.toLocaleString("pt-BR")} ${selectedProduto.unidade}s` : "..."}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Lista de Formatos */}
                {produtoPrecisaFormato(selectedProduto) && (
                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[350px] pr-1">
                    {formatos?.map((form) => {
                      const saldo = getFormatoSaldo(selectedProduto._id, form._id);
                      return (
                        <button
                          key={form._id}
                          onClick={() => {
                            setSelectedFormato(form);
                            setStep(3);
                          }}
                          className="w-full text-left bg-bg-glacial border border-[rgba(91,112,120,0.12)] hover:border-brand-primary active:bg-[rgba(14,124,156,0.05)] rounded-glacial px-4 py-4 text-sm font-bold text-ink-primary cursor-pointer min-h-[56px] flex items-center justify-between"
                        >
                          <span>⚖️ {form.nome} ({form.peso_kg} kg)</span>
                          <span className="text-[10px] font-semibold font-mono text-ink-secondary">
                            Disponível: {saldosCamara !== undefined ? `${saldo.toLocaleString("pt-BR")} ${selectedProduto.unidade}s` : "..."}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Informar Quantidade via Keypad */}
            {step === 3 && selectedProduto && (
              <div className="flex-1 flex flex-col items-center">
                <h2 className="text-sm font-bold text-ink-primary mb-2 text-left self-start">Passo 3: Digite a Quantidade</h2>
                
                {/* Item Selecionado e Saldo Atual */}
                <div className="w-full bg-bg-glacial p-3 rounded-glacial border border-[rgba(91,112,120,0.1)] text-xs text-left mb-4 flex justify-between">
                  <div>
                    <span className="font-semibold text-ink-primary block">
                      {selectedProduto.nome} {selectedSabor ? `(${selectedSabor.nome})` : ""} {selectedFormato ? `(${selectedFormato.nome})` : ""}
                    </span>
                    <span className="text-[10px] text-ink-secondary">Unidade: {selectedProduto.unidade}</span>
                  </div>
                  {flow === "perda" && (
                    <div className="text-right">
                      <span className="text-ink-secondary block text-[9px] uppercase font-mono">Saldo Disponível</span>
                      <span className="font-bold text-ink-primary font-mono text-sm tabular-nums">
                        {saldoDisponivel !== undefined ? `${saldoDisponivel} ${selectedProduto.unidade}s` : "Carregando..."}
                      </span>
                    </div>
                  )}
                </div>

                {/* Display Quantidade */}
                <div className="w-full h-14 bg-bg-glacial border-2 border-[rgba(91,112,120,0.2)] rounded-glacial flex items-center justify-center mb-6 font-mono text-xl font-bold text-ink-primary tabular-nums">
                  {quantidadeStr || "0"} <span className="ml-1 text-sm font-sans text-ink-secondary">{selectedProduto.unidade}s</span>
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-2 w-full max-w-[280px] mb-6">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleKeypadPress(num)}
                      className="h-12 bg-bg-glacial border border-[rgba(91,112,120,0.15)] active:bg-[rgba(14,124,156,0.1)] rounded-full font-bold text-base text-ink-primary cursor-pointer select-none"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={handleKeypadClear}
                    className="h-12 bg-bg-glacial border border-[rgba(91,112,120,0.15)] active:bg-brand-error-bg text-brand-error rounded-full text-xs font-bold cursor-pointer select-none"
                  >
                    LIMPAR
                  </button>
                  <button
                    onClick={() => handleKeypadPress("0")}
                    className="h-12 bg-bg-glacial border border-[rgba(91,112,120,0.15)] active:bg-[rgba(14,124,156,0.1)] rounded-full font-bold text-base text-ink-primary cursor-pointer select-none"
                  >
                    0
                  </button>
                  <button
                    onClick={handleKeypadDelete}
                    className="h-12 bg-bg-glacial border border-[rgba(91,112,120,0.15)] active:bg-[rgba(91,112,120,0.1)] rounded-full text-base text-ink-secondary cursor-pointer select-none"
                  >
                    ⌫
                  </button>
                </div>

                {/* Avançar */}
                <button
                  onClick={() => {
                    const q = parseFloat(quantidadeStr);
                    if (isNaN(q) || q <= 0) {
                      setError("Digite uma quantidade válida.");
                      return;
                    }
                    if (flow === "perda" && saldoDisponivel !== undefined && saldoDisponivel < q) {
                      setError(`Saldo insuficiente! Estoque disponível na câmara: ${saldoDisponivel}`);
                      return;
                    }
                    setError(null);
                    if (flow === "perda") setStep(4); // Vai para escolher motivo
                    else setStep(4); // Vai direto para confirmação
                  }}
                  className="w-full bg-brand-primary text-white font-bold py-3.5 px-6 rounded-glacial hover:bg-opacity-90 transition-all cursor-pointer min-h-[56px]"
                >
                  Confirmar Quantidade
                </button>
              </div>
            )}

            {/* Step 4 (Flow Perda): Escolha do Motivo de Perda */}
            {step === 4 && flow === "perda" && selectedProduto && (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-bold text-ink-primary mb-4 text-left">Passo 4: Selecione o Motivo de Perda</h2>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 mb-4">
                    {motivosPerda?.map((m) => (
                      <button
                        key={m._id}
                        onClick={() => setSelectedMotivo(m)}
                        className={`w-full text-left rounded-glacial px-4 py-3 text-xs font-bold transition-all min-h-[48px] cursor-pointer flex items-center justify-between ${
                          selectedMotivo?._id === m._id
                            ? "bg-[rgba(14,124,156,0.1)] border border-brand-primary text-brand-primary"
                            : "bg-bg-glacial border border-[rgba(91,112,120,0.12)] text-ink-primary"
                        }`}
                      >
                        <span>📉 {m.descricao}</span>
                        {selectedMotivo?._id === m._id && <span>✓</span>}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-1 text-left">Observação Adicional (Opcional)</label>
                    <input
                      type="text"
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      placeholder="Ex: Embalagem furada durante empilhamento"
                      className="w-full bg-bg-glacial text-xs px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!selectedMotivo) {
                      setError("Selecione o motivo da perda.");
                      return;
                    }
                    setError(null);
                    setStep(5); // Vai para confirmação
                  }}
                  className="w-full bg-brand-primary text-white font-bold py-3.5 px-6 rounded-glacial hover:bg-opacity-90 transition-all cursor-pointer min-h-[56px] mt-6"
                >
                  Avançar
                </button>
              </div>
            )}

            {/* Step Final: Resumo e Confirmação de Produção ou Perda */}
            {((step === 4 && flow === "producao") || (step === 5 && flow === "perda")) && selectedProduto && (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-bold text-brand-primary mb-4 text-left uppercase tracking-wider text-xs">
                    Resumo do Lançamento
                  </h2>
                  
                  <div className="bg-bg-glacial p-4 rounded-glacial border border-[rgba(91,112,120,0.15)] space-y-3 text-xs text-left mb-6 font-mono">
                    <div className="flex justify-between border-b border-[rgba(91,112,120,0.1)] pb-1.5">
                      <span className="text-ink-secondary">Operação:</span>
                      <span className="font-bold text-ink-primary capitalize">{flow === "producao" ? "Produção (Entrada)" : "Perda (Saída)"}</span>
                    </div>
                    <div className="flex justify-between border-b border-[rgba(91,112,120,0.1)] pb-1.5">
                      <span className="text-ink-secondary">Câmara:</span>
                      <span className="font-bold text-ink-primary">{camaraNome}</span>
                    </div>
                    <div className="flex justify-between border-b border-[rgba(91,112,120,0.1)] pb-1.5">
                      <span className="text-ink-secondary">Item:</span>
                      <span className="font-bold text-ink-primary">{selectedProduto.nome}</span>
                    </div>
                    {(selectedSabor || selectedFormato) && (
                      <div className="flex justify-between border-b border-[rgba(91,112,120,0.1)] pb-1.5">
                        <span className="text-ink-secondary">{selectedSabor ? "Sabor:" : "Formato:"}</span>
                        <span className="font-bold text-ink-primary">{selectedSabor ? selectedSabor.nome : selectedFormato?.nome}</span>
                      </div>
                    )}
                    {flow === "perda" && selectedMotivo && (
                      <div className="flex justify-between border-b border-[rgba(91,112,120,0.1)] pb-1.5">
                        <span className="text-ink-secondary">Motivo:</span>
                        <span className="font-bold text-ink-primary">{selectedMotivo.descricao}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-[rgba(91,112,120,0.1)] pb-1.5">
                      <span className="text-ink-secondary">Quantidade:</span>
                      <span className="font-bold text-ink-primary tabular-nums">{quantidadeStr} {selectedProduto.unidade}s</span>
                    </div>
                    
                    {/* Exibe o peso total equivalente se for pacotes */}
                    {selectedProduto.unidade === "pacote" && selectedFormato && (
                      <div className="flex justify-between">
                        <span className="text-ink-secondary">Peso Equivalente:</span>
                        <span className="font-bold text-brand-primary tabular-nums">{parseFloat(quantidadeStr) * selectedFormato.peso_kg} kg</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  disabled={loading}
                  onClick={handleGravar}
                  className="w-full bg-brand-primary text-white font-bold py-3.5 px-6 rounded-glacial hover:bg-opacity-90 active:scale-[0.98] transition-all cursor-pointer min-h-[56px] flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <span className="animate-pulse">Gravando movimentação...</span>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Gravar Lançamento</span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        )}

        {/* ==========================================
           WIZARD FLOW: CARREGAMENTO (SAÍDA COMPLEXA)
           ========================================== */}
        {flow === "carregamento" && (
          <div className="flex-1 flex flex-col justify-between bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial p-6">
            
            {/* Step 1: Dados do Carregamento (Venda/Patrocínio + Detalhes) */}
            {step === 1 && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-ink-primary mb-2 text-left">Passo 1: Tipo de Saída & Operação</h2>
                  
                  {/* Toggle Venda / Patrocínio */}
                  <div className="grid grid-cols-2 gap-2 bg-bg-glacial p-1 rounded-glacial border border-[rgba(91,112,120,0.15)] mb-2">
                    <button
                      type="button"
                      onClick={() => setTipoCarregamento("venda")}
                      className={`py-2 text-xs font-bold rounded-glacial transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                        tipoCarregamento === "venda"
                          ? "bg-white text-ink-primary shadow"
                          : "text-ink-secondary"
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5 text-brand-primary" />
                      <span>Venda Comercial</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoCarregamento("patrocinio")}
                      className={`py-2 text-xs font-bold rounded-glacial transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                        tipoCarregamento === "patrocinio"
                          ? "bg-white text-brand-primary shadow"
                          : "text-ink-secondary"
                      }`}
                    >
                      <Gift className="w-3.5 h-3.5 text-brand-primary" />
                      <span>Patrocínio</span>
                    </button>
                  </div>

                  {/* Selecionar Cliente se for Venda */}
                  {tipoCarregamento === "venda" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-ink-primary block mb-1 text-left">Cliente / Destinatário</label>
                        <select
                          value={selectedClienteId}
                          onChange={(e) => {
                            setSelectedClienteId(e.target.value);
                            if (e.target.value !== "avulso") {
                              setClienteNomeAvulso("");
                            }
                          }}
                          className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
                        >
                          <option value="">Selecione um cliente...</option>
                          {clientes?.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.nome} {c.whatsapp ? `(${c.whatsapp})` : ""}
                            </option>
                          ))}
                          <option value="avulso">Cliente Avulso / Revendedor Não Cadastrado</option>
                        </select>
                      </div>

                      {selectedClienteId === "avulso" && (
                        <div>
                          <label className="text-xs font-bold text-ink-primary block mb-1 text-left">Nome do Cliente Avulso</label>
                          <input
                            required
                            type="text"
                            value={clienteNomeAvulso}
                            onChange={(e) => setClienteNomeAvulso(e.target.value)}
                            placeholder="Ex: João Revendedor, Bar do Porto..."
                            className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Nome do Evento (Se Patrocínio) */}
                  {tipoCarregamento === "patrocinio" && (
                    <div>
                      <label className="text-xs font-bold text-ink-primary block mb-1 text-left">Nome do Evento (Obrigatório)</label>
                      <input
                        required
                        type="text"
                        value={evento}
                        onChange={(e) => setEvento(e.target.value)}
                        placeholder="Ex: Copa 065 Gelo / Show X"
                        className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-1 text-left">Nome do Motorista</label>
                    <input
                      required
                      type="text"
                      value={motorista}
                      onChange={(e) => setMotorista(e.target.value)}
                      placeholder="Ex: Carlos Oliveira"
                      className="w-full bg-bg-glacial text-sm px-4 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>

                  {/* Toggle Veículo Frota / Terceiro */}
                  <div>
                    <label className="text-xs font-bold text-ink-primary block mb-1.5 text-left">Veículo de Transporte</label>
                    <div className="grid grid-cols-2 gap-2 bg-bg-glacial p-1 rounded-glacial border border-[rgba(91,112,120,0.15)] mb-3">
                      <button
                        type="button"
                        onClick={() => setVeiculoTipo("proprio")}
                        className={`py-2 text-xs font-bold rounded-glacial transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                          veiculoTipo === "proprio"
                            ? "bg-white text-ink-primary shadow"
                            : "text-ink-secondary"
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5 text-brand-primary" />
                        <span>Frota Própria</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setVeiculoTipo("terceiro")}
                        className={`py-2 text-xs font-bold rounded-glacial transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                          veiculoTipo === "terceiro"
                            ? "bg-white text-ink-primary shadow"
                            : "text-ink-secondary"
                        }`}
                      >
                        <Car className="w-3.5 h-3.5 text-brand-primary" />
                        <span>Veículo Terceiro</span>
                      </button>
                    </div>

                    {/* Seleção do Veículo Próprio */}
                    {veiculoTipo === "proprio" && (
                      <div className="space-y-2 max-h-32 overflow-y-auto bg-bg-glacial p-3 rounded-glacial border border-[rgba(91,112,120,0.1)]">
                        {veiculos?.map((v) => (
                          <label key={v._id} className="flex items-center space-x-2 text-xs text-ink-primary cursor-pointer min-h-[36px]">
                            <input
                              type="radio"
                              name="veiculo"
                              checked={selectedVeiculo?._id === v._id}
                              onChange={() => setSelectedVeiculo(v)}
                              className="text-brand-primary focus:ring-brand-primary"
                            />
                            <span>{v.descricao} ({v.placa})</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Input do Veículo de Terceiro */}
                    {veiculoTipo === "terceiro" && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="text"
                            maxLength={7}
                            value={terceiroPlaca}
                            onChange={(e) => setTerceiroPlaca(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                            placeholder="Placa (Ex: ABC1D23)"
                            className="w-full bg-bg-glacial text-xs px-3 py-2 rounded-glacial border border-[rgba(91,112,120,0.15)] font-mono text-center focus:outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={terceiroDescricao}
                            onChange={(e) => setTerceiroDescricao(e.target.value)}
                            placeholder="Modelo (Ex: Fiorino Branca)"
                            className="w-full bg-bg-glacial text-xs px-3 py-2 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                 <button
                  onClick={() => {
                    if (tipoCarregamento === "patrocinio" && !evento) {
                      setError("Nome do evento é obrigatório.");
                      return;
                    }
                    if (tipoCarregamento === "venda") {
                      if (!selectedClienteId) {
                        setError("Selecione um cliente ou defina um cliente avulso.");
                        return;
                      }
                      if (selectedClienteId === "avulso" && !clienteNomeAvulso.trim()) {
                        setError("Informe o nome do cliente avulso.");
                        return;
                      }
                    }
                    if (!motorista) {
                      setError("Nome do motorista é obrigatório.");
                      return;
                    }
                    if (veiculoTipo === "proprio" && !selectedVeiculo) {
                      setError("Selecione um veículo da frota.");
                      return;
                    }
                    if (veiculoTipo === "terceiro" && (!terceiroPlaca || !terceiroDescricao)) {
                      setError("Preencha a placa e a descrição do veículo terceiro.");
                      return;
                    }
                    setError(null);
                    setStep(2); // Avança para adicionar itens
                  }}
                  className="w-full bg-brand-primary text-white font-bold py-3.5 px-6 rounded-glacial hover:bg-opacity-90 transition-all cursor-pointer min-h-[56px] mt-6"
                >
                  Avançar para Itens
                </button>
              </div>
            )}

            {/* Step 2: Gerenciamento dos Itens do Carregamento */}
            {step === 2 && (
              <div className="flex-1 flex flex-col justify-between">
                
                {/* SUB-WIZARD: Lista e Adição de Itens */}
                {subStep === 0 ? (
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-ink-primary mb-4 text-left">Passo 2: Itens do Carregamento</h2>
                      
                      {/* Tabela de itens adicionados */}
                      {itensCarregamento.length === 0 ? (
                        <div className="text-center py-8 bg-bg-glacial rounded-glacial border border-dashed border-[rgba(91,112,120,0.2)] text-xs text-ink-secondary italic mb-4">
                          Nenhum item adicionado à carga ainda.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[220px] overflow-y-auto mb-4 pr-1">
                          {itensCarregamento.map((item, index) => (
                            <div key={index} className="flex justify-between items-center bg-bg-glacial p-3 rounded-glacial border border-[rgba(91,112,120,0.1)] text-xs text-left">
                              <div>
                                <span className="font-bold text-ink-primary block">
                                  {item.produtoNome} {item.saborNome ? `(${item.saborNome})` : ""} {item.formatoNome ? `(${item.formatoNome})` : ""}
                                </span>
                                <span className="text-[10px] text-ink-secondary">Quantidade: {item.quantidade} {item.unidade}s</span>
                              </div>
                              <button
                                onClick={() => handleRemoveCarregamentoItem(index)}
                                className="text-xs text-brand-error font-bold hover:underline cursor-pointer min-h-[36px] px-2"
                              >
                                Excluir
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Botão de adicionar novo item */}
                      <button
                        onClick={() => setSubStep(1)}
                        className="w-full py-3 bg-[rgba(14,124,156,0.05)] hover:bg-[rgba(14,124,156,0.1)] border border-dashed border-brand-primary text-brand-primary text-xs font-bold rounded-glacial cursor-pointer min-h-[48px] flex items-center justify-center space-x-1"
                      >
                        <span>➕</span>
                        <span>Adicionar Item</span>
                      </button>
                    </div>

                    {/* Botão Avançar para Confirmação */}
                    <button
                      onClick={() => {
                        if (itensCarregamento.length === 0) {
                          setError("Adicione pelo menos um item à carga.");
                          return;
                        }
                        setError(null);
                        setStep(3); // Vai para confirmação
                      }}
                      className="w-full bg-brand-primary text-white font-bold py-3.5 px-6 rounded-glacial hover:bg-opacity-90 transition-all cursor-pointer min-h-[56px] mt-6"
                    >
                      Avançar para Confirmação
                    </button>
                  </div>
                ) : (
                  /* SUB-FLOW: Adicionar Item */
                  <div className="flex-1 flex flex-col justify-between">
                    
                    {/* Sub-Passo 1: Selecionar o Produto do Item */}
                    {subStep === 1 && (
                      <div className="flex-1 flex flex-col">
                        <h3 className="text-xs font-bold text-ink-secondary mb-3 text-left">Lançar Item (Escolha o Produto)</h3>
                        <div className="space-y-2 flex-1 overflow-y-auto max-h-[260px] pr-1">
                          {produtos?.map((prod) => {
                            const saldoTotal = getProductTotalSaldo(prod._id);
                            return (
                              <button
                                key={prod._id}
                                onClick={() => {
                                  setSelectedProduto(prod);
                                  if (produtoPrecisaSabor(prod) || produtoPrecisaFormato(prod)) {
                                    setSubStep(2);
                                  } else {
                                    setSubStep(3);
                                  }
                                }}
                                className="w-full text-left bg-bg-glacial border border-[rgba(91,112,120,0.12)] rounded-glacial px-4 py-3.5 text-xs font-bold text-ink-primary flex items-center justify-between cursor-pointer min-h-[48px]"
                              >
                                <div className="flex flex-col text-left">
                                  <span>{prod.nome}</span>
                                  <span className="text-[9px] text-ink-secondary font-normal font-mono mt-0.5">
                                    Saldo: {saldosCamara !== undefined ? `${saldoTotal.toLocaleString("pt-BR")} ${prod.unidade}s` : "Carregando..."}
                                  </span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-white text-ink-secondary shrink-0 self-center">
                                  {prod.unidade}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Sub-Passo 2: Selecionar Sabor ou Formato do Item */}
                    {subStep === 2 && selectedProduto && (
                      <div className="flex-1 flex flex-col">
                        <h3 className="text-xs font-bold text-ink-secondary mb-3 text-left">
                          Lançar Item (Escolha o {produtoPrecisaSabor(selectedProduto) ? "Sabor" : "Formato"})
                        </h3>
                        
                         {produtoPrecisaSabor(selectedProduto) && (
                          <div className="space-y-2 flex-1 overflow-y-auto max-h-[260px] pr-1">
                            {sabores?.map((sab) => {
                              const saldo = getSaborSaldo(selectedProduto._id, sab._id);
                              return (
                                <button
                                  key={sab._id}
                                  onClick={() => {
                                    setSelectedSabor(sab);
                                    setSubStep(3);
                                  }}
                                  className="w-full text-left bg-bg-glacial border border-[rgba(91,112,120,0.12)] rounded-glacial px-4 py-3.5 text-xs font-bold text-ink-primary cursor-pointer min-h-[48px] flex items-center justify-between"
                                >
                                  <span>🍉 {sab.nome}</span>
                                  <span className="text-[9px] font-semibold font-mono text-ink-secondary">
                                    Disponível: {saldosCamara !== undefined ? `${saldo.toLocaleString("pt-BR")} ${selectedProduto.unidade}s` : "..."}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {produtoPrecisaFormato(selectedProduto) && (
                          <div className="space-y-2 flex-1 overflow-y-auto max-h-[260px] pr-1">
                            {formatos?.map((form) => {
                              const saldo = getFormatoSaldo(selectedProduto._id, form._id);
                              return (
                                <button
                                  key={form._id}
                                  onClick={() => {
                                    setSelectedFormato(form);
                                    setSubStep(3);
                                  }}
                                  className="w-full text-left bg-bg-glacial border border-[rgba(91,112,120,0.12)] rounded-glacial px-4 py-3.5 text-xs font-bold text-ink-primary cursor-pointer min-h-[48px] flex items-center justify-between"
                                >
                                  <span>⚖️ {form.nome} ({form.peso_kg} kg)</span>
                                  <span className="text-[9px] font-semibold font-mono text-ink-secondary">
                                    Disponível: {saldosCamara !== undefined ? `${saldo.toLocaleString("pt-BR")} ${selectedProduto.unidade}s` : "..."}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sub-Passo 3: Selecionar Quantidade do Item com Validador de Saldo */}
                    {subStep === 3 && selectedProduto && (
                      <div className="flex-1 flex flex-col items-center">
                        <h3 className="text-xs font-bold text-ink-secondary mb-2 text-left self-start">Lançar Item (Quantidade de Carga)</h3>
                        
                        {/* Status do Saldo */}
                        <div className="w-full bg-bg-glacial p-3 rounded-glacial border border-[rgba(91,112,120,0.1)] text-xs text-left mb-4 flex justify-between">
                          <div>
                            <span className="font-semibold text-ink-primary block">
                              {selectedProduto.nome} {selectedSabor ? `(${selectedSabor.nome})` : ""} {selectedFormato ? `(${selectedFormato.nome})` : ""}
                            </span>
                            <span className="text-[10px] text-ink-secondary">Unidade: {selectedProduto.unidade}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-ink-secondary block text-[9px] uppercase font-mono">Disponível</span>
                            <span className="font-bold text-ink-primary font-mono text-sm tabular-nums">
                              {saldoDisponivel !== undefined ? `${saldoDisponivel} ${selectedProduto.unidade}s` : "Carregando..."}
                            </span>
                          </div>
                        </div>

                        {/* Display Qtd */}
                        <div className="w-full h-12 bg-bg-glacial border-2 border-[rgba(91,112,120,0.2)] rounded-glacial flex items-center justify-center mb-4 font-mono text-lg font-bold text-ink-primary tabular-nums">
                          {quantidadeStr || "0"} <span className="ml-1 text-xs font-sans text-ink-secondary">{selectedProduto.unidade}s</span>
                        </div>

                        {/* Keypad */}
                        <div className="grid grid-cols-3 gap-2 w-full max-w-[240px] mb-6">
                          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                            <button
                              key={num}
                              onClick={() => handleKeypadPress(num)}
                              className="h-10 bg-bg-glacial border border-[rgba(91,112,120,0.15)] active:bg-[rgba(14,124,156,0.1)] rounded-full font-bold text-sm text-ink-primary cursor-pointer select-none"
                            >
                              {num}
                            </button>
                          ))}
                          <button
                            onClick={handleKeypadClear}
                            className="h-10 bg-bg-glacial border border-[rgba(91,112,120,0.15)] text-brand-error rounded-full text-[10px] font-bold cursor-pointer select-none"
                          >
                            LIMPAR
                          </button>
                          <button
                            onClick={() => handleKeypadPress("0")}
                            className="h-10 bg-bg-glacial border border-[rgba(91,112,120,0.15)] active:bg-[rgba(14,124,156,0.1)] rounded-full font-bold text-sm text-ink-primary cursor-pointer select-none"
                          >
                            0
                          </button>
                          <button
                            onClick={handleKeypadDelete}
                            className="h-10 bg-bg-glacial border border-[rgba(91,112,120,0.15)] active:bg-[rgba(91,112,120,0.1)] rounded-full text-sm text-ink-secondary cursor-pointer select-none"
                          >
                            ⌫
                          </button>
                        </div>

                        {/* Botão para Confirmar e Inserir Item */}
                        <button
                          onClick={handleConfirmCarregamentoItem}
                          className="w-full bg-brand-primary text-white font-bold py-3 px-6 rounded-glacial hover:bg-opacity-90 transition-all cursor-pointer min-h-[48px]"
                        >
                          Adicionar Item à Carga
                        </button>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}

            {/* Step 3: Resumo Geral e Confirmação do Carregamento */}
            {step === 3 && (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-bold text-brand-primary mb-4 text-left uppercase tracking-wider text-xs">
                    Confirmar Carregamento
                  </h2>
                  
                  {/* Dados da Carga */}
                  <div className="bg-bg-glacial p-4 rounded-glacial border border-[rgba(91,112,120,0.15)] space-y-2.5 text-xs text-left mb-4 font-mono">
                    <div className="flex justify-between border-b border-[rgba(91,112,120,0.1)] pb-1.5">
                      <span className="text-ink-secondary">Operação:</span>
                      <span className="font-bold text-ink-primary capitalize">{tipoCarregamento === "venda" ? "Venda" : "Patrocínio"}</span>
                    </div>
                    {tipoCarregamento === "patrocinio" && (
                      <div className="flex justify-between border-b border-[rgba(91,112,120,0.1)] pb-1.5">
                        <span className="text-ink-secondary">Evento:</span>
                        <span className="font-bold text-ink-primary">{evento}</span>
                      </div>
                    )}
                    {tipoCarregamento === "venda" && (
                      <div className="flex justify-between border-b border-[rgba(91,112,120,0.1)] pb-1.5">
                        <span className="text-ink-secondary">Cliente:</span>
                        <span className="font-bold text-ink-primary">
                          {selectedClienteId === "avulso" ? clienteNomeAvulso : clientes?.find(c => c._id === selectedClienteId)?.nome || "Não informado"}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-[rgba(91,112,120,0.1)] pb-1.5">
                      <span className="text-ink-secondary">Motorista:</span>
                      <span className="font-bold text-ink-primary">{motorista}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-secondary">Veículo:</span>
                      <span className="font-bold text-ink-primary">
                        {veiculoTipo === "proprio" ? `${selectedVeiculo?.descricao} (${selectedVeiculo?.placa})` : `${terceiroDescricao} (${terceiroPlaca})`}
                      </span>
                    </div>
                  </div>

                  {/* Lista de Itens */}
                  <h3 className="text-xs font-bold text-ink-primary mb-2 text-left">Lista de Itens Carregados:</h3>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto mb-6 pr-1">
                    {itensCarregamento.map((item, index) => (
                      <div key={index} className="flex justify-between bg-bg-glacial px-3 py-2 rounded border border-[rgba(91,112,120,0.1)] text-xs text-left">
                        <span className="text-ink-primary font-semibold">
                          {item.produtoNome} {item.saborNome ? `(${item.saborNome})` : ""} {item.formatoNome ? `(${item.formatoNome})` : ""}
                        </span>
                        <span className="text-ink-secondary font-mono font-bold tabular-nums">
                          {item.quantidade} {item.unidade}s
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  disabled={loading}
                  onClick={handleGravar}
                  className="w-full bg-brand-success text-white font-bold py-3.5 px-6 rounded-glacial hover:bg-opacity-90 active:scale-[0.98] transition-all cursor-pointer min-h-[56px] flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <span className="animate-pulse">Gravando carregamento...</span>
                  ) : (
                    <>
                      <Truck className="w-5 h-5 mr-1" />
                      <span>Gravar Carregamento</span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        )}

      </div>
      
      {/* Footer */}
      <footer className="text-center text-[10px] text-ink-secondary mt-8 font-mono">
        Estoque 065 &copy; 2026 — Registro Seguro de Atividades
      </footer>
    </div>
  );
}
