import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Truck,
  User,
  Calendar,
  X,
  FileText,
  Search,
  AlertCircle,
  TrendingDown,
  Info,
  Loader2,
  Gift,
  DollarSign,
  Download,
  RotateCcw,
  Plus,
  Printer,
  Share2
} from "lucide-react";
import { exportToCSV } from "../../utils/export";

export default function Carregamentos() {
  const carregamentos = useQuery(api.carregamentos.listarCarregamentos) as any[] | undefined;
  const registrarRetorno = useMutation(api.carregamentos.registrarRetornoPatrocinio);

  // Queries para cadastros auxiliares do modal de Lançamento
  const camaras = useQuery(api.cadastros.listarCamarasAtivas);
  const veiculos = useQuery(api.cadastros.listarVeiculosAtivos);
  const produtos = useQuery(api.cadastros.listarProdutosAtivos);
  const sabores = useQuery(api.cadastros.listarSaboresAtivos);
  const formatosPacote = useQuery(api.cadastros.listarFormatosPacoteAtivos);
  const clientes = useQuery(api.cadastros.listarClientesAtivos);
  const empresaPerfil = useQuery(api.cadastros.obterPerfilEmpresa);
  const motivosPerda = useQuery(api.cadastros.listarMotivosPerdaAtivos);
 
  // Mutations
  const lancarCarregamento = useMutation(api.estoque.lancarCarregamento);
  const lancarPerda = useMutation(api.estoque.lancarPerda);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Detalhes & Retornos
  const [selectedCarregamentoId, setSelectedCarregamentoId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Estado dos inputs do modal de retorno
  const [itensRetorno, setItensRetorno] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Estado para Lançamento de Carregamento pelo Admin
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCamaraId, setNewCamaraId] = useState<Id<"camaras"> | "">("");
  const [newTipo, setNewTipo] = useState<"venda" | "patrocinio">("venda");
  const [newEvento, setNewEvento] = useState("");
  const [newVeiculoId, setNewVeiculoId] = useState<Id<"veiculos"> | "terceiro" | "">("");
  const [newVeiculoPlaca, setNewVeiculoPlaca] = useState("");
  const [newVeiculoDescricao, setNewVeiculoDescricao] = useState("");
  const [newMotorista, setNewMotorista] = useState("");
  const [newClienteId, setNewClienteId] = useState<Id<"clientes"> | "avulso" | "">("");
  const [newClienteNome, setNewClienteNome] = useState("");
  const [newItens, setNewItens] = useState<any[]>([]);
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Estado para Lançamento de Perda
  const [showLossModal, setShowLossModal] = useState(false);
  const [lossCamaraId, setLossCamaraId] = useState<Id<"camaras"> | "">("");
  const [lossProdutoId, setLossProdutoId] = useState<Id<"produtos"> | "">("");
  const [lossSaborId, setLossSaborId] = useState<Id<"sabores"> | "">("");
  const [lossFormatoId, setLossFormatoId] = useState<Id<"formatos_pacote"> | "">("");
  const [lossQuantidade, setLossQuantidade] = useState("");
  const [lossMotivoId, setLossMotivoId] = useState<Id<"motivos_perda"> | "">("");
  const [lossObservacao, setLossObservacao] = useState("");
  const [lossError, setLossError] = useState<string | null>(null);
  const [lossSaving, setLossSaving] = useState(false);

  // Encontrar carregamento ativo nos dados locais
  const activeCarregamento = carregamentos?.find((c) => c._id === selectedCarregamentoId);

  const handlePrintRomaneio = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!activeCarregamento) return;
    
    const totalPeso = activeCarregamento.itens.reduce((acc: number, i: any) => acc + i.peso_total_kg, 0);
    
    const title = `*065 GELO - ROMANEIO DE CARGA*\n`;
    const div = `=============================\n`;
    const data = `*Data:* ${new Date(activeCarregamento.data_hora).toLocaleString("pt-BR")}\n`;
    const tipo = `*Tipo:* ${activeCarregamento.tipo === "venda" ? "Venda" : `Patrocínio (${activeCarregamento.evento})`}\n`;
    const cli = activeCarregamento.cliente_nome ? `*Cliente:* ${activeCarregamento.cliente_nome}\n` : "";
    const mot = `*Motorista:* ${activeCarregamento.motorista}\n`;
    const veic = `*Veículo:* ${activeCarregamento.veiculo_placa} (${activeCarregamento.veiculo_descricao || "Sem desc."})\n`;
    const camara = `*Origem:* ${activeCarregamento.camara_nome}\n`;
    const respons = `*Responsável:* ${activeCarregamento.responsavel_id}\n`;
    
    let itemsText = `\n*PRODUTOS CARREGADOS:*\n`;
    activeCarregamento.itens.forEach((i: any) => {
      const sabor = i.sabor_nome ? ` sabor ${i.sabor_nome}` : "";
      const formato = i.formato_nome ? ` (${i.formato_nome})` : "";
      itemsText += `- ${i.quantidade} ${i.produto_unidade === "pacote" ? "pct" : "kg"} ${i.produto_nome}${sabor}${formato}\n`;
    });
    
    itemsText += `\n*Peso Total:* ${totalPeso.toFixed(1)} kg\n`;
    
    const matchedClient = clientes?.find(cl => cl._id === activeCarregamento.cliente_id);
    const clientPhone = matchedClient?.whatsapp || "";
    
    const message = encodeURIComponent(title + div + data + tipo + cli + mot + veic + camara + respons + itemsText);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${clientPhone ? `55${clientPhone.replace(/\D/g, "")}` : ""}&text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleSaveLoss = async (e: React.FormEvent) => {
    e.preventDefault();
    setLossError(null);

    if (!lossCamaraId) {
      setLossError("Selecione a câmara fria.");
      return;
    }
    if (!lossProdutoId) {
      setLossError("Selecione o produto.");
      return;
    }
    const qty = parseFloat(lossQuantidade);
    if (isNaN(qty) || qty <= 0) {
      setLossError("Informe uma quantidade válida e maior que zero.");
      return;
    }
    if (!lossMotivoId) {
      setLossError("Selecione o motivo da perda.");
      return;
    }

    setLossSaving(true);
    try {
      await lancarPerda({
        camaraId: lossCamaraId as Id<"camaras">,
        produtoId: lossProdutoId as Id<"produtos">,
        saborId: lossSaborId ? (lossSaborId as Id<"sabores">) : undefined,
        formatoPacoteId: lossFormatoId ? (lossFormatoId as Id<"formatos_pacote">) : undefined,
        quantidade: qty,
        motivoPerdaId: lossMotivoId as Id<"motivos_perda">,
        observacao: lossObservacao.trim() || undefined,
      });

      alert("Lançamento de perda registrado com sucesso!");
      setShowLossModal(false);
    } catch (err: any) {
      setLossError(err.message || "Erro ao registrar a perda.");
    } finally {
      setLossSaving(false);
    }
  };

  // Exportar carregamentos para CSV
  const handleExportCarregamentosCSV = () => {
    if (!filteredCarregamentos || filteredCarregamentos.length === 0) return;

    const headers = [
      "Data/Hora",
      "Tipo",
      "Evento/Destino",
      "Motorista",
      "Veículo Placa",
      "Descrição Veículo",
      "Câmara Origem",
      "Status",
      "Peso Total Carregado (kg)",
      "Itens e Quantidades"
    ];

    const data = filteredCarregamentos.map(c => {
      const totalPeso = c.itens.reduce((acc: number, i: any) => acc + i.peso_total_kg, 0);
      const statusMap: Record<string, string> = {
        concluido: "Venda Concluída",
        retorno_pendente: "Pendente de Retorno",
        retorno_concluido: "Retorno Liquidado"
      };

      const itensString = c.itens.map((item: any) => {
        const saborDesc = item.sabor_nome ? ` sabor ${item.sabor_nome}` : "";
        const formatoDesc = item.formato_nome ? ` (${item.formato_nome})` : "";
        return `${item.quantidade}${item.produto_unidade === "pacote" ? "pct" : "kg"} ${item.produto_nome}${saborDesc}${formatoDesc}`;
      }).join(" | ");

      return [
        formatDateTime(c.data_hora),
        c.tipo === "venda" ? "Venda" : "Patrocínio",
        c.evento || "N/A",
        c.motorista,
        c.veiculo_placa,
        c.veiculo_descricao || "",
        c.camara_nome,
        statusMap[c.status] || c.status,
        totalPeso.toFixed(1),
        itensString
      ];
    });

    exportToCSV("gestao_carregamentos", headers, data);
  };

  // Inicializar inputs de retorno quando o modal abre
  useEffect(() => {
    if (activeCarregamento && showReturnModal) {
      setItensRetorno(
        activeCarregamento.itens.map((item: any) => ({
          ...item,
          quantidade_retornada: 0 // Começa em zero (nada voltou)
        }))
      );
    }
  }, [activeCarregamento, showReturnModal]);

  // Filtragem dos carregamentos
  const filteredCarregamentos = carregamentos?.filter((c) => {
    const search = searchQuery.toLowerCase().trim();
    const matchSearch =
      !search ||
      c.motorista.toLowerCase().includes(search) ||
      c.veiculo_placa.toLowerCase().includes(search) ||
      c.responsavel_id.toLowerCase().includes(search) ||
      (c.evento && c.evento.toLowerCase().includes(search));

    const matchTipo = !tipoFilter || c.tipo === tipoFilter;
    const matchStatus = !statusFilter || c.status === statusFilter;

    return matchSearch && matchTipo && matchStatus;
  });

  // Helpers para determinar se produto precisa de sabor ou formato no Lançamento do Admin
  const produtoPrecisaSabor = (produtoId: string) => {
    const prod = produtos?.find((p) => p._id === produtoId);
    return prod ? prod.nome.toLowerCase().includes("saborizado") : false;
  };

  const produtoPrecisaFormato = (produtoId: string) => {
    const prod = produtos?.find((p) => p._id === produtoId);
    return prod ? (prod.unidade === "pacote" && !prod.nome.toLowerCase().includes("saborizado")) : false;
  };

  // Handlers para adicionar/remover itens dinamicamente
  const handleAddItem = () => {
    setNewItens((prev) => [
      ...prev,
      { produtoId: "", saborId: "", formatoPacoteId: "", quantidade: 1 }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setNewItens((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemFieldChange = (index: number, field: string, value: any) => {
    setNewItens((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      
      // Resetar sabor e formato se o produto de origem for alterado
      if (field === "produtoId") {
        updated[index].saborId = "";
        updated[index].formatoPacoteId = "";
      }
      
      return updated;
    });
  };

  // Gravar o carregamento direto pelo Admin
  const handleSaveCarregamento = async () => {
    setAddError(null);
    if (!newCamaraId) {
      setAddError("Selecione a câmara fria de origem.");
      return;
    }
    if (!newMotorista.trim()) {
      setAddError("Informe o nome do motorista.");
      return;
    }
    if (newTipo === "patrocinio" && !newEvento.trim()) {
      setAddError("Informe o nome do evento para saídas de patrocínio.");
      return;
    }
    if (newTipo === "venda") {
      if (!newClienteId) {
        setAddError("Selecione um cliente ou defina um cliente avulso.");
        return;
      }
      if (newClienteId === "avulso" && !newClienteNome.trim()) {
        setAddError("Informe o nome do cliente avulso/revendedor.");
        return;
      }
    }
    if (!newVeiculoId) {
      setAddError("Selecione um veículo cadastrado ou defina um terceiro.");
      return;
    }
    if (newVeiculoId === "terceiro" && !newVeiculoPlaca.trim()) {
      setAddError("Informe a placa do veículo de terceiro.");
      return;
    }
    if (newItens.length === 0) {
      setAddError("Adicione pelo menos um item ao carregamento.");
      return;
    }

    // Validar itens antes do payload
    for (let i = 0; i < newItens.length; i++) {
      const item = newItens[i];
      if (!item.produtoId) {
        setAddError(`Selecione o produto do item #${i + 1}.`);
        return;
      }
      if (produtoPrecisaSabor(item.produtoId) && !item.saborId) {
        setAddError(`Selecione o sabor para o item #${i + 1}.`);
        return;
      }
      if (produtoPrecisaFormato(item.produtoId) && !item.formatoPacoteId) {
        setAddError(`Selecione o formato de pacote para o item #${i + 1}.`);
        return;
      }
      const qty = parseFloat(item.quantidade);
      if (isNaN(qty) || qty <= 0) {
        setAddError(`A quantidade do item #${i + 1} deve ser maior que zero.`);
        return;
      }
    }

    try {
      setAdding(true);
      const isTerceiro = newVeiculoId === "terceiro";
      const payloadVeiculoId = isTerceiro ? undefined : (newVeiculoId as Id<"veiculos">);
      const payloadPlaca = isTerceiro ? newVeiculoPlaca.trim().toUpperCase() : undefined;
      const payloadDescricao = isTerceiro ? newVeiculoDescricao.trim() : undefined;

      const payloadItens = newItens.map(i => ({
        produtoId: i.produtoId as Id<"produtos">,
        saborId: i.saborId ? (i.saborId as Id<"sabores">) : undefined,
        formatoPacoteId: i.formatoPacoteId ? (i.formatoPacoteId as Id<"formatos_pacote">) : undefined,
        quantidade: parseFloat(i.quantidade)
      }));

      const payloadClienteId = (newTipo === "venda" && newClienteId !== "avulso" && newClienteId) ? (newClienteId as Id<"clientes">) : undefined;
      const payloadClienteNome = (newTipo === "venda") 
        ? (newClienteId === "avulso" ? newClienteNome.trim() : (clientes?.find(c => c._id === newClienteId)?.nome || undefined))
        : undefined;

      await lancarCarregamento({
        camaraId: newCamaraId as Id<"camaras">,
        tipo: newTipo,
        evento: newTipo === "patrocinio" ? newEvento.trim() : undefined,
        veiculoId: payloadVeiculoId,
        veiculoPlaca: payloadPlaca,
        veiculoDescricao: payloadDescricao,
        motorista: newMotorista.trim(),
        clienteId: payloadClienteId,
        clienteNome: payloadClienteNome,
        itens: payloadItens
      });

      // Fechar e limpar estados
      setShowAddModal(false);
      setNewCamaraId("");
      setNewTipo("venda");
      setNewEvento("");
      setNewVeiculoId("");
      setNewVeiculoPlaca("");
      setNewVeiculoDescricao("");
      setNewMotorista("");
      setNewClienteId("");
      setNewClienteNome("");
      setNewItens([]);
      alert("Carregamento registrado e estoque debitado com sucesso!");
    } catch (err: any) {
      setAddError(err.message || "Erro ao registrar carregamento.");
    } finally {
      setAdding(false);
    }
  };

  // Alterar input de retorno
  const handleReturnQtyChange = (index: number, valStr: string) => {
    const val = parseFloat(valStr);
    const cleanVal = isNaN(val) ? 0 : val;

    setItensRetorno((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const maxQty = item.quantidade;
      const qtyRetornada = cleanVal < 0 ? 0 : cleanVal > maxQty ? maxQty : cleanVal;

      updated[index] = {
        ...item,
        quantidade_retornada: qtyRetornada
      };
      return updated;
    });
  };

  // Salvar Retorno
  const handleSaveRetorno = async () => {
    if (!selectedCarregamentoId) return;
    setError(null);
    try {
      setSaving(true);
      const payloadItens = itensRetorno.map((i) => ({
        produto_id: i.produto_id,
        sabor_id: i.sabor_id,
        formato_pacote_id: i.formato_pacote_id,
        quantidade_retornada: i.quantidade_retornada
      }));

      await registrarRetorno({
        id: selectedCarregamentoId as Id<"carregamentos">,
        itens: payloadItens
      });

      setShowReturnModal(false);
      setSelectedCarregamentoId(null);
      alert("Retorno de patrocínio registrado com sucesso! O estoque foi reintegrado.");
    } catch (err: any) {
      setError(err.message || "Erro ao registrar retorno.");
    } finally {
      setSaving(false);
    }
  };

  // Formatar datas
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Status Badges
  const renderStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; style: string }> = {
      concluido: {
        label: "Venda Concluída",
        style: "bg-emerald-50 text-emerald-700 border-emerald-200"
      },
      retorno_pendente: {
        label: "Pendente de Retorno",
        style: "bg-amber-50 text-amber-800 border-amber-200"
      },
      retorno_concluido: {
        label: "Retorno Liquidado",
        style: "bg-indigo-50 text-indigo-700 border-indigo-200"
      }
    };

    const conf = configs[status] || { label: status, style: "bg-gray-50 text-gray-700 border-gray-200" };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all ${conf.style}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          status === "concluido" 
            ? "bg-emerald-500" 
            : status === "retorno_pendente" 
              ? "bg-amber-500 animate-pulse" 
              : "bg-indigo-500"
        }`}></span>
        {conf.label}
      </span>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ink-primary tracking-tight">Movimentação de Saída</h2>
        <p className="text-sm text-ink-secondary">Monitore vendas, patrocínios de eventos, controle devoluções e descarte de estoque.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => {
            setNewTipo("venda");
            setNewClienteId("");
            setNewClienteNome("");
            setNewItens([{ produtoId: "", saborId: "", formatoPacoteId: "", quantidade: 1 }]);
            setShowAddModal(true);
          }}
          className="glass-card interactive-card rounded-glacial p-4 text-left flex items-center space-x-4 cursor-pointer hover:border-emerald-500/30 group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-110 transition-transform">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink-primary">Registrar Venda</h3>
            <p className="text-[10px] text-ink-secondary mt-0.5">Saída comercial com cliente.</p>
          </div>
        </button>

        <button
          onClick={() => {
            setNewTipo("patrocinio");
            setNewEvento("");
            setNewItens([{ produtoId: "", saborId: "", formatoPacoteId: "", quantidade: 1 }]);
            setShowAddModal(true);
          }}
          className="glass-card interactive-card rounded-glacial p-4 text-left flex items-center space-x-4 cursor-pointer hover:border-purple-500/30 group"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:scale-110 transition-transform">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink-primary">Registrar Patrocínio</h3>
            <p className="text-[10px] text-ink-secondary mt-0.5">Carga pendente de devolução.</p>
          </div>
        </button>

        <button
          onClick={() => {
            setLossCamaraId("");
            setLossProdutoId("");
            setLossSaborId("");
            setLossFormatoId("");
            setLossQuantidade("");
            setLossMotivoId("");
            setLossObservacao("");
            setLossError(null);
            setShowLossModal(true);
          }}
          className="glass-card interactive-card rounded-glacial p-4 text-left flex items-center space-x-4 cursor-pointer hover:border-rose-500/30 group"
        >
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 group-hover:scale-110 transition-transform">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink-primary">Registrar Perda</h3>
            <p className="text-[10px] text-ink-secondary mt-0.5">Baixa por descarte ou avaria.</p>
          </div>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial p-4 sm:p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Busca Livre */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-secondary" />
            <input
              type="text"
              placeholder="Motorista, placa, evento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-glacial text-sm pl-8 pr-3 py-1.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          {/* Filtro Tipo */}
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="bg-bg-glacial text-sm px-3 py-1.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
          >
            <option value="">Todos os tipos de saída</option>
            <option value="venda">Vendas</option>
            <option value="patrocinio">Patrocínios</option>
            <option value="perda">Perdas</option>
          </select>

          {/* Filtro Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-bg-glacial text-sm px-3 py-1.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
          >
            <option value="">Todos os status</option>
            <option value="concluido">Vendas Concluídas</option>
            <option value="retorno_pendente">Pendentes de Retorno</option>
            <option value="retorno_concluido">Retornos Liquidados</option>
          </select>
        </div>

        {/* Ações de Filtro e Exportação */}
        <div className="mt-4 pt-4 border-t border-[rgba(91,112,120,0.1)] flex items-center justify-between">
          <button
            onClick={handleExportCarregamentosCSV}
            disabled={!filteredCarregamentos || filteredCarregamentos.length === 0}
            className="text-xs bg-bg-glacial text-ink-primary hover:bg-[rgba(91,112,120,0.05)] font-bold py-1.5 px-3 rounded-glacial border border-[rgba(91,112,120,0.15)] transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          {(searchQuery || tipoFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setTipoFilter("");
                setStatusFilter("");
              }}
              className="text-xs text-brand-primary font-bold hover:underline cursor-pointer flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Carregamentos */}
      <div className="bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial p-4 sm:p-6 overflow-x-auto">
        {!carregamentos ? (
          <div className="text-center py-12 text-ink-secondary text-sm">Carregando carregamentos...</div>
        ) : filteredCarregamentos && filteredCarregamentos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
            <Truck className="w-10 h-10 text-ink-secondary/30 mb-3" />
            <p className="text-sm font-semibold text-ink-primary">Nenhuma movimentação de saída localizada</p>
            <p className="text-xs text-ink-secondary mt-1">Tente ajustar os filtros de busca.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[rgba(91,112,120,0.15)] text-ink-secondary text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Data / Hora</th>
                <th className="py-3 px-4 font-semibold">Motorista</th>
                <th className="py-3 px-4 font-semibold">Cliente / Destino</th>
                <th className="py-3 px-4 font-semibold">Veículo / Placa</th>
                <th className="py-3 px-4 font-semibold">Tipo</th>
                <th className="py-3 px-4 font-semibold">Câmara</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(91,112,120,0.1)] text-sm">
              {filteredCarregamentos?.map((c) => {
                const totalPeso = c.itens.reduce((acc: number, i: any) => acc + i.peso_total_kg, 0);

                return (
                  <tr key={c._id} className="hover:bg-[rgba(91,112,120,0.02)] transition-all">
                    {/* Data / Hora */}
                    <td className="py-3.5 px-4 font-medium text-ink-primary whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-ink-secondary/70" />
                        <span>{formatDateTime(c.data_hora)}</span>
                      </div>
                    </td>

                    {/* Motorista */}
                    <td className="py-3.5 px-4 text-ink-primary font-bold">
                      <div className="flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-ink-secondary/70" />
                        <span>{c.motorista}</span>
                      </div>
                    </td>

                    {/* Cliente / Destino */}
                    <td className="py-3.5 px-4 text-ink-primary">
                      {c.tipo === "venda" ? (
                        c.cliente_nome ? (
                          <div className="font-semibold">{c.cliente_nome}</div>
                        ) : (
                          <div className="text-ink-secondary/50 italic">Não informado</div>
                        )
                      ) : c.tipo === "patrocinio" ? (
                        <span className="inline-flex items-center text-xs text-purple-750 bg-purple-50 border border-purple-150 px-2 py-0.5 rounded font-semibold max-w-[160px] truncate" title={c.evento}>
                          {c.evento || "Patrocínio"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-rose-750 bg-rose-50 border border-rose-150 px-2 py-0.5 rounded font-semibold max-w-[160px] truncate" title={c.cliente_nome}>
                          {c.cliente_nome || "Perda"}
                        </span>
                      )}
                    </td>

                    {/* Veículo / Placa */}
                    <td className="py-3.5 px-4 text-ink-secondary">
                      {c.tipo === "perda" ? (
                        <span className="text-ink-secondary/50 italic">—</span>
                      ) : (
                        <>
                          <div className="font-semibold leading-tight">{c.veiculo_placa}</div>
                          <div className="text-[10px] text-ink-secondary/70 mt-0.5">
                            {c.veiculo_descricao || "Sem descrição"} • {totalPeso.toFixed(1)} kg
                          </div>
                        </>
                      )}
                    </td>

                    {/* Tipo */}
                    <td className="py-3.5 px-4">
                      {c.tipo === "venda" ? (
                        <span className="inline-flex items-center text-xs text-cyan-700 bg-cyan-50 border border-cyan-100 px-2 py-0.5 rounded font-semibold">
                          <DollarSign className="w-3 h-3 mr-0.5" /> Venda
                        </span>
                      ) : c.tipo === "patrocinio" ? (
                        <span className="inline-flex items-center text-xs text-purple-770 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded font-semibold" title={c.evento}>
                          <Gift className="w-3 h-3 mr-0.5" /> Patrocínio
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-rose-770 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded font-semibold">
                          <AlertCircle className="w-3 h-3 mr-0.5" /> Perda
                        </span>
                      )}
                    </td>

                    {/* Câmara */}
                    <td className="py-3.5 px-4 text-ink-secondary font-medium">{c.camara_nome}</td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {c.tipo === "perda" ? (
                        <span className="inline-flex items-center text-xs text-rose-770 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded font-semibold">
                          Descartado
                        </span>
                      ) : (
                        renderStatusBadge(c.status)
                      )}
                    </td>

                    {/* Ações */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-3">
                        {c.status === "retorno_pendente" && (
                          <button
                            onClick={() => {
                              setSelectedCarregamentoId(c._id);
                              setShowReturnModal(true);
                            }}
                            className="text-xs text-amber-600 font-bold hover:underline cursor-pointer"
                          >
                            Dar Baixa (Retorno)
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedCarregamentoId(c._id);
                            setShowDetailsModal(true);
                          }}
                          className="text-xs text-brand-primary font-bold hover:underline cursor-pointer flex items-center space-x-0.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Ver Carga</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal 1: Detalhes da Carga */}
      {showDetailsModal && activeCarregamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/30 backdrop-blur-[2px] animate-fade-in">
          <div className="w-full max-w-xl bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial p-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-[rgba(91,112,120,0.15)] pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-ink-primary flex items-center space-x-2">
                  {activeCarregamento.tipo === "perda" ? (
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                  ) : (
                    <Truck className="w-5 h-5 text-brand-primary" />
                  )}
                  <span>{activeCarregamento.tipo === "perda" ? "Detalhamento de Perda" : "Conferência de Carga"}</span>
                </h3>
                <p className="text-xs text-ink-secondary mt-0.5">
                  {activeCarregamento.tipo === "perda" ? (
                    <span>Origem: <span className="font-semibold">{activeCarregamento.camara_nome}</span></span>
                  ) : (
                    <span>Motorista: <span className="font-semibold">{activeCarregamento.motorista}</span> • Placa {activeCarregamento.veiculo_placa}</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedCarregamentoId(null);
                }}
                className="text-ink-secondary hover:text-ink-primary cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Informações Extras */}
              <div className="grid grid-cols-2 gap-4 bg-bg-glacial/50 p-3 rounded text-xs text-ink-primary border border-[rgba(91,112,120,0.08)]">
                <div>
                  <span className="text-[10px] text-ink-secondary block font-bold uppercase tracking-wider">Responsável pelo Lançamento</span>
                  <span>{activeCarregamento.responsavel_id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-ink-secondary block font-bold uppercase tracking-wider">Data / Hora de Saída</span>
                  <span>{formatDateTime(activeCarregamento.data_hora)}</span>
                </div>
                {activeCarregamento.tipo === "venda" && activeCarregamento.cliente_nome && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-ink-secondary block font-bold uppercase tracking-wider">Cliente / Destinatário</span>
                    <span className="font-semibold text-brand-primary">
                      {activeCarregamento.cliente_nome}
                    </span>
                  </div>
                )}
                {activeCarregamento.tipo === "patrocinio" && activeCarregamento.evento && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-ink-secondary block font-bold uppercase tracking-wider">Evento Vinculado</span>
                    <span className="font-semibold text-purple-750 bg-purple-50 px-2 py-0.5 rounded border border-purple-150 inline-block mt-0.5">
                      {activeCarregamento.evento}
                    </span>
                  </div>
                )}
              </div>

              {/* Tabela de Itens Carregados */}
              <div>
                <span className="text-xs font-bold text-ink-primary block mb-2">Produtos no Veículo</span>
                <div className="max-h-60 overflow-y-auto border border-[rgba(91,112,120,0.15)] rounded">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-bg-glacial text-ink-secondary text-[10px] uppercase font-semibold border-b border-[rgba(91,112,120,0.15)]">
                        <th className="py-2 px-3">Item</th>
                        <th className="py-2 px-3 text-right">Qtd Carregada</th>
                        <th className="py-2 px-3 text-right">Peso (kg)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(91,112,120,0.08)] text-xs text-ink-primary">
                      {activeCarregamento.itens.map((item: any, idx: number) => {
                        const saborDesc = item.sabor_nome ? ` sabor ${item.sabor_nome}` : "";
                        const formatoDesc = item.formato_nome ? ` (${item.formato_nome})` : "";
                        return (
                          <tr key={idx} className="hover:bg-bg-glacial/20">
                            <td className="py-2.5 px-3 font-medium">{item.produto_nome}{saborDesc}{formatoDesc}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">{item.quantidade} {item.produto_unidade === "pacote" ? "pct" : "kg"}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-ink-secondary">{item.peso_total_kg.toFixed(1)} kg</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Se for Patrocínio Concluído, mostrar itens devolvidos e consumo */}
              {activeCarregamento.status === "retorno_concluido" && activeCarregamento.retorno_itens && (
                <div className="border-t border-[rgba(91,112,120,0.15)] pt-4">
                  <span className="text-xs font-bold text-ink-primary block mb-2">Reconciliação e Consumo do Patrocínio</span>
                  <div className="max-h-60 overflow-y-auto border border-[rgba(91,112,120,0.15)] rounded">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-bg-glacial text-ink-secondary text-[10px] uppercase font-semibold border-b border-[rgba(91,112,120,0.15)]">
                          <th className="py-2 px-3">Item</th>
                          <th className="py-2 px-3 text-right">Carregado</th>
                          <th className="py-2 px-3 text-right">Retornado</th>
                          <th className="py-2 px-3 text-right">Consumido</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(91,112,120,0.08)] text-xs text-ink-primary">
                        {activeCarregamento.itens.map((cItem: any, idx: number) => {
                          const rItem = activeCarregamento.retorno_itens?.find((r: any) => {
                            const matchProd = r.produto_id === cItem.produto_id;
                            const matchSabor = cItem.sabor_id ? r.sabor_id === cItem.sabor_id : !r.sabor_id;
                            const matchFormato = cItem.formato_pacote_id ? r.formato_pacote_id === cItem.formato_pacote_id : !r.formato_pacote_id;
                            return matchProd && matchSabor && matchFormato;
                          });

                          const qtyRetornada = rItem ? rItem.quantidade : 0;
                          const consumido = cItem.quantidade - qtyRetornada;
                          
                          const saborDesc = cItem.sabor_nome ? ` sabor ${cItem.sabor_nome}` : "";
                          const formatoDesc = cItem.formato_nome ? ` (${cItem.formato_nome})` : "";

                          return (
                            <tr key={idx} className="hover:bg-bg-glacial/20">
                              <td className="py-2.5 px-3 font-medium">{cItem.produto_nome}{saborDesc}{formatoDesc}</td>
                              <td className="py-2.5 px-3 text-right font-mono text-ink-secondary">{cItem.quantidade}</td>
                              <td className="py-2.5 px-3 text-right font-mono text-emerald-600">+{qtyRetornada}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">{consumido}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Botões de Fechar e Ações */}
              <div className="flex items-center justify-between border-t border-[rgba(91,112,120,0.15)] pt-4 mt-2">
                {activeCarregamento.tipo !== "perda" ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrintRomaneio}
                      className="inline-flex items-center space-x-1.5 text-xs bg-white text-ink-primary hover:bg-bg-glacial font-semibold py-2 px-3 rounded-glacial border border-[rgba(91,112,120,0.15)] transition-all cursor-pointer shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5 text-ink-secondary" />
                      <span>Imprimir Romaneio</span>
                    </button>
                    <button
                      onClick={handleShareWhatsApp}
                      className="inline-flex items-center space-x-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-glacial transition-all cursor-pointer shadow-sm"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Enviar WhatsApp</span>
                    </button>
                  </div>
                ) : (
                  <div />
                )}
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedCarregamentoId(null);
                  }}
                  className="text-xs bg-bg-glacial text-ink-secondary hover:text-ink-primary font-semibold py-2 px-4 rounded-glacial border border-[rgba(91,112,120,0.15)] transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Registrar Retorno de Patrocínio */}
      {showReturnModal && activeCarregamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/30 backdrop-blur-[2px] animate-fade-in">
          <div className="w-full max-w-xl bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial p-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-[rgba(91,112,120,0.15)] pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-ink-primary flex items-center space-x-2">
                  <TrendingDown className="w-5 h-5 text-amber-500" />
                  <span>Baixa de Retorno: {activeCarregamento.evento || "Patrocínio"}</span>
                </h3>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Informe a quantidade que retornou não utilizada para a câmara.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowReturnModal(false);
                  setSelectedCarregamentoId(null);
                  setError(null);
                }}
                className="text-ink-secondary hover:text-ink-primary cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-brand-error-bg text-brand-error border border-[rgba(201,58,66,0.2)] rounded text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* Tabela de Digitação */}
              <div className="max-h-60 overflow-y-auto border border-[rgba(91,112,120,0.15)] rounded">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bg-glacial text-ink-secondary text-[10px] uppercase font-semibold border-b border-[rgba(91,112,120,0.15)]">
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3 text-right">Carregado</th>
                      <th className="py-2 px-3 text-center w-28">Voltou</th>
                      <th className="py-2 px-3 text-right">Consumido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(91,112,120,0.08)] text-xs text-ink-primary">
                    {itensRetorno.map((item, idx) => {
                      const saborDesc = item.sabor_nome ? ` sabor ${item.sabor_nome}` : "";
                      const formatoDesc = item.formato_nome ? ` (${item.formato_nome})` : "";
                      const consumido = item.quantidade - (item.quantidade_retornada || 0);

                      return (
                        <tr key={idx} className="hover:bg-bg-glacial/20">
                          <td className="py-2 px-3 font-medium">{item.produto_nome}{saborDesc}{formatoDesc}</td>
                          <td className="py-2 px-3 text-right font-mono text-ink-secondary">{item.quantidade}</td>
                          <td className="py-1.5 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max={item.quantidade}
                              step="any"
                              value={item.quantidade_retornada}
                              onChange={(e) => handleReturnQtyChange(idx, e.target.value)}
                              className="w-20 text-center font-mono font-bold text-ink-primary bg-bg-glacial border border-[rgba(91,112,120,0.15)] rounded py-1 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">{consumido}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center space-x-2 text-[10px] text-ink-secondary bg-amber-50/50 p-2.5 rounded border border-amber-100/50">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  Ao salvar, a quantidade informada no campo "Voltou" será somada de volta ao estoque físico da câmara fria de origem como transação de retorno.
                </span>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end border-t border-[rgba(91,112,120,0.15)] pt-4 mt-2 space-x-2">
                <button
                  onClick={() => {
                    setShowReturnModal(false);
                    setSelectedCarregamentoId(null);
                    setError(null);
                  }}
                  className="text-xs bg-bg-glacial text-ink-secondary hover:text-ink-primary font-semibold py-2 px-4 rounded-glacial border border-[rgba(91,112,120,0.15)] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveRetorno}
                  disabled={saving}
                  className="text-xs bg-brand-primary text-white hover:bg-opacity-90 font-semibold py-2 px-4 rounded-glacial transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  <span>Confirmar Retorno</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Registrar Novo Carregamento */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/30 backdrop-blur-[2px] animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial p-6 animate-scale-in my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[rgba(91,112,120,0.15)] pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-ink-primary flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-brand-primary" />
                  <span>Novo Carregamento: {newTipo === "venda" ? "Venda" : "Patrocínio / Evento"}</span>
                </h3>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Preencha as informações para baixar o estoque e registrar o despacho.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddError(null);
                }}
                className="text-ink-secondary hover:text-ink-primary cursor-pointer p-1 text-lg font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {addError && (
                <div className="p-3 bg-brand-error-bg text-brand-error border border-[rgba(201,58,66,0.2)] rounded text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Câmara de Origem */}
                <div className={newTipo === "patrocinio" ? "sm:col-span-2" : ""}>
                  <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Câmara Fria de Origem</label>
                  <select
                    value={newCamaraId}
                    onChange={(e) => setNewCamaraId(e.target.value as Id<"camaras">)}
                    className="w-full bg-bg-glacial text-sm px-3 py-2 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
                  >
                    <option value="">Selecione uma câmara...</option>
                    {camaras?.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cliente (se for venda) */}
                {newTipo === "venda" && (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Cliente / Destinatário</label>
                      <select
                        value={newClienteId}
                        onChange={(e) => {
                          setNewClienteId(e.target.value as Id<"clientes"> | "avulso" | "");
                          if (e.target.value !== "avulso") {
                            setNewClienteNome("");
                          }
                        }}
                        className="w-full bg-bg-glacial text-sm px-3 py-2 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
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

                    {newClienteId === "avulso" && (
                      <div>
                        <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Nome do Cliente Avulso</label>
                        <input
                          type="text"
                          placeholder="Ex: João Revendedor, Bar do Porto..."
                          value={newClienteNome}
                          onChange={(e) => setNewClienteNome(e.target.value)}
                          className="w-full bg-bg-glacial text-sm px-3 py-2 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Evento (se for patrocínio) */}
                {newTipo === "patrocinio" && (
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Nome do Evento / Destino</label>
                    <input
                      type="text"
                      placeholder="Ex: Show de Verão 2026, Patrocínio Atlético Club..."
                      value={newEvento}
                      onChange={(e) => setNewEvento(e.target.value)}
                      className="w-full bg-bg-glacial text-sm px-3 py-2 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                )}

                {/* Motorista */}
                <div>
                  <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Nome do Motorista</label>
                  <input
                    type="text"
                    placeholder="Ex: João da Silva..."
                    value={newMotorista}
                    onChange={(e) => setNewMotorista(e.target.value)}
                    className="w-full bg-bg-glacial text-sm px-3 py-2 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>

                {/* Veículo */}
                <div>
                  <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Veículo de Transporte</label>
                  <select
                    value={newVeiculoId}
                    onChange={(e) => {
                      setNewVeiculoId(e.target.value as "" | "terceiro" | Id<"veiculos">);
                      if (e.target.value !== "terceiro") {
                        setNewVeiculoPlaca("");
                        setNewVeiculoDescricao("");
                      }
                    }}
                    className="w-full bg-bg-glacial text-sm px-3 py-2 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
                  >
                    <option value="">Selecione um veículo...</option>
                    {veiculos?.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.placa} ({v.descricao})
                      </option>
                    ))}
                    <option value="terceiro">Outro / Veículo de Terceiro</option>
                  </select>
                </div>

                {/* Campos do veículo se for de Terceiro */}
                {newVeiculoId === "terceiro" && (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Placa (Terceiro)</label>
                      <input
                        type="text"
                        placeholder="Ex: ABC1D23..."
                        value={newVeiculoPlaca}
                        onChange={(e) => setNewVeiculoPlaca(e.target.value)}
                        className="w-full bg-bg-glacial text-sm px-3 py-2 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Modelo / Descrição</label>
                      <input
                        type="text"
                        placeholder="Ex: Fiat Fiorino Branca..."
                        value={newVeiculoDescricao}
                        onChange={(e) => setNewVeiculoDescricao(e.target.value)}
                        className="w-full bg-bg-glacial text-sm px-3 py-2 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Tabela Dinâmica de Itens */}
              <div className="border-t border-[rgba(91,112,120,0.15)] pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-ink-primary">Produtos a Carregar</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-brand-primary font-bold hover:underline cursor-pointer flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Item</span>
                  </button>
                </div>

                {newItens.length === 0 ? (
                  <div className="text-center py-6 text-xs text-ink-secondary bg-bg-glacial/30 rounded border border-dashed border-[rgba(91,112,120,0.15)]">
                    Nenhum item adicionado. Clique em "Adicionar Item" acima.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {newItens.map((item, index) => {
                      const precisaSabor = produtoPrecisaSabor(item.produtoId);
                      const precisaFormato = produtoPrecisaFormato(item.produtoId);

                      return (
                        <div
                          key={index}
                          className="p-3 bg-bg-glacial/40 rounded border border-[rgba(91,112,120,0.1)] flex flex-col sm:flex-row items-start sm:items-center gap-3"
                        >
                          {/* Produto */}
                          <div className="flex-1 w-full">
                            <select
                              value={item.produtoId}
                              onChange={(e) => handleItemFieldChange(index, "produtoId", e.target.value)}
                              className="w-full bg-white text-xs px-2.5 py-1.5 rounded border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
                            >
                              <option value="">Selecione o produto...</option>
                              {produtos?.map((p) => (
                                <option key={p._id} value={p._id}>
                                  {p.nome}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Sabor (se aplicável) */}
                          {precisaSabor && (
                            <div className="w-full sm:w-40">
                              <select
                                value={item.saborId}
                                onChange={(e) => handleItemFieldChange(index, "saborId", e.target.value)}
                                className="w-full bg-white text-xs px-2.5 py-1.5 rounded border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
                              >
                                <option value="">Sabor...</option>
                                {sabores?.map((s) => (
                                  <option key={s._id} value={s._id}>
                                    {s.nome}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Formato (se aplicável) */}
                          {precisaFormato && (
                            <div className="w-full sm:w-40">
                              <select
                                value={item.formatoPacoteId}
                                onChange={(e) => handleItemFieldChange(index, "formatoPacoteId", e.target.value)}
                                className="w-full bg-white text-xs px-2.5 py-1.5 rounded border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
                              >
                                <option value="">Pacote...</option>
                                {formatosPacote?.map((f) => (
                                  <option key={f._id} value={f._id}>
                                    {f.nome}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Quantidade */}
                          <div className="w-24 flex items-center space-x-1.5">
                            <input
                              type="number"
                              min="1"
                              step="any"
                              value={item.quantidade}
                              onChange={(e) => handleItemFieldChange(index, "quantidade", e.target.value)}
                              className="w-full text-center font-mono font-bold bg-white text-xs px-2 py-1.5 rounded border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            />
                            <span className="text-[10px] text-ink-secondary shrink-0">
                              {(() => {
                                const prod = produtos?.find(p => p._id === item.produtoId);
                                return prod ? (prod.unidade === "pacote" ? "pct" : "kg") : "";
                              })()}
                            </span>
                          </div>

                          {/* Remover */}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-brand-error hover:text-opacity-80 p-1 cursor-pointer transition-colors"
                            title="Remover Item"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Botões do Modal */}
              <div className="flex items-center justify-end border-t border-[rgba(91,112,120,0.15)] pt-4 mt-4 space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddError(null);
                  }}
                  className="text-xs bg-bg-glacial text-ink-secondary hover:text-ink-primary font-semibold py-2 px-4 rounded-glacial border border-[rgba(91,112,120,0.15)] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCarregamento}
                  disabled={adding}
                  className="text-xs bg-brand-primary text-white hover:bg-opacity-90 font-semibold py-2 px-4 rounded-glacial transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                >
                  {adding && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Lançar Carregamento</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Estilos para impressão de romaneio */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-romaneio, #print-romaneio * {
            visibility: visible;
          }
          #print-romaneio {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
          }
        }
      `}} />

      {/* Elemento oculto para impressão (Romaneio) */}
      {activeCarregamento && (
        <div id="print-romaneio" className="hidden print:block text-black p-8 bg-white max-w-2xl mx-auto border-2 border-black font-sans">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
            <div className="flex items-center space-x-4">
              {empresaPerfil?.logoUrl ? (
                <img src={empresaPerfil.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
              ) : (
                <div className="w-16 h-16 border-2 border-black flex items-center justify-center font-bold text-3xl">🧊</div>
              )}
              <div className="text-left">
                <h1 className="text-xl font-black uppercase tracking-wide">{empresaPerfil?.nome || "065 GELO"}</h1>
                <p className="text-xs">{empresaPerfil?.cnpj ? `CNPJ: ${empresaPerfil.cnpj}` : ""}</p>
                <p className="text-xs">{empresaPerfil?.endereco || ""}</p>
                <p className="text-xs">{empresaPerfil?.telefone || ""} {empresaPerfil?.whatsapp ? `| WhatsApp: ${empresaPerfil.whatsapp}` : ""}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold block uppercase tracking-wider">Romaneio de Carga</span>
              <span className="text-lg font-mono font-bold">#{activeCarregamento._id.substring(activeCarregamento._id.length - 6).toUpperCase()}</span>
            </div>
          </div>

          {/* Dados Gerais */}
          <div className="grid grid-cols-2 gap-4 mb-6 border-b border-gray-300 pb-4 text-sm">
            <div>
              <span className="text-[10px] text-gray-500 font-bold block uppercase">Data / Hora de Saída</span>
              <span className="font-semibold">{formatDateTime(activeCarregamento.data_hora)}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold block uppercase">Tipo de Carga</span>
              <span className="font-semibold uppercase">{activeCarregamento.tipo === "venda" ? "Venda Comercial" : `Patrocínio (${activeCarregamento.evento})`}</span>
            </div>
            {activeCarregamento.cliente_nome && (
              <div className="col-span-2">
                <span className="text-[10px] text-gray-500 font-bold block uppercase">Cliente / Destinatário</span>
                <span className="font-semibold">{activeCarregamento.cliente_nome}</span>
              </div>
            )}
            <div>
              <span className="text-[10px] text-gray-500 font-bold block uppercase">Motorista</span>
              <span className="font-semibold">{activeCarregamento.motorista}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold block uppercase">Veículo / Placa</span>
              <span className="font-semibold">{activeCarregamento.veiculo_placa} {activeCarregamento.veiculo_descricao ? `(${activeCarregamento.veiculo_descricao})` : ""}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold block uppercase">Câmara de Origem</span>
              <span className="font-semibold">{activeCarregamento.camara_nome}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold block uppercase">Responsável Saída</span>
              <span className="font-semibold">{activeCarregamento.responsavel_id}</span>
            </div>
          </div>

          {/* Itens do Romaneio */}
          <div className="mb-8">
            <span className="text-xs font-bold text-gray-700 block uppercase mb-2">Produtos Carregados</span>
            <table className="w-full text-left border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-black text-xs font-bold uppercase">
                  <th className="py-2 px-3 border-r border-black">Descrição do Item</th>
                  <th className="py-2 px-3 text-right border-r border-black">Qtd Carregada</th>
                  <th className="py-2 px-3 text-right">Peso (kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {activeCarregamento.itens.map((item: any, idx: number) => {
                  const saborDesc = item.sabor_nome ? ` sabor ${item.sabor_nome}` : "";
                  const formatoDesc = item.formato_nome ? ` (${item.formato_nome})` : "";
                  return (
                    <tr key={idx} className="border-b border-black">
                      <td className="py-2 px-3 border-r border-black font-medium">{item.produto_nome}{saborDesc}{formatoDesc}</td>
                      <td className="py-2 px-3 text-right border-r border-black font-bold">{item.quantidade} {item.produto_unidade === "pacote" ? "pct" : "kg"}</td>
                      <td className="py-2 px-3 text-right">{item.peso_total_kg.toFixed(1)} kg</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="text-right mt-3 text-sm font-bold">
              <span>Peso Total do Carregamento: </span>
              <span className="font-mono text-base">{activeCarregamento.itens.reduce((acc: number, i: any) => acc + i.peso_total_kg, 0).toFixed(1)} kg</span>
            </div>
          </div>

          {/* Assinaturas */}
          <div className="grid grid-cols-2 gap-8 pt-12 mt-12 border-t border-gray-300 text-center text-xs">
            <div>
              <div className="border-b border-black w-48 mx-auto mb-2"></div>
              <span className="font-bold block">Assinatura do Responsável</span>
              <span className="text-[10px] text-gray-500">065 GELO</span>
            </div>
            <div>
              <div className="border-b border-black w-48 mx-auto mb-2"></div>
              <span className="font-bold block">Assinatura do Recebedor</span>
              <span className="text-[10px] text-gray-500">Motorista / Cliente</span>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Registrar Perda */}
      {showLossModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/30 backdrop-blur-[2px] animate-fade-in">
          <div className="w-full max-w-md bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial p-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-[rgba(91,112,120,0.15)] pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-ink-primary flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                  <span>Registrar Perda / Descarte</span>
                </h3>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Deduza do estoque produtos danificados, quebras ou descartes.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowLossModal(false);
                  setLossError(null);
                }}
                className="text-ink-secondary hover:text-ink-primary cursor-pointer p-1 text-lg font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLoss} className="space-y-4">
              {lossError && (
                <div className="p-3 bg-brand-error-bg text-brand-error border border-[rgba(201,58,66,0.2)] rounded text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{lossError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Câmara Fria */}
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Câmara Fria</label>
                  <select
                    value={lossCamaraId}
                    onChange={(e) => setLossCamaraId(e.target.value as Id<"camaras">)}
                    className="w-full bg-bg-glacial text-sm px-3 py-2 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
                  >
                    <option value="">Selecione a câmara...</option>
                    {camaras?.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Produto */}
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Produto</label>
                  <select
                    value={lossProdutoId}
                    onChange={(e) => {
                      setLossProdutoId(e.target.value as Id<"produtos">);
                      setLossSaborId("");
                      setLossFormatoId("");
                    }}
                    className="w-full bg-bg-glacial text-sm px-3 py-2 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
                  >
                    <option value="">Selecione o produto...</option>
                    {produtos?.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Saborizado */}
                {produtos?.find(p => p._id === lossProdutoId)?.nome.toLowerCase().includes("saborizado") && (
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Sabor</label>
                    <select
                      value={lossSaborId}
                      onChange={(e) => setLossSaborId(e.target.value as Id<"sabores">)}
                      className="w-full bg-bg-glacial text-sm px-3 py-2 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
                    >
                      <option value="">Selecione o sabor...</option>
                      {sabores?.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Formato de Pacote */}
                {produtos?.find(p => p._id === lossProdutoId)?.unidade === "pacote" && !produtos?.find(p => p._id === lossProdutoId)?.nome.toLowerCase().includes("saborizado") && (
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Formato de Pacote</label>
                    <select
                      value={lossFormatoId}
                      onChange={(e) => setLossFormatoId(e.target.value as Id<"formatos_pacote">)}
                      className="w-full bg-bg-glacial text-sm px-3 py-2 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
                    >
                      <option value="">Selecione o formato...</option>
                      {formatosPacote?.map((f) => (
                        <option key={f._id} value={f._id}>
                          {f.nome} ({f.peso_kg} kg)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Quantidade */}
                <div>
                  <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Quantidade</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ex: 10"
                    value={lossQuantidade}
                    onChange={(e) => setLossQuantidade(e.target.value)}
                    className="w-full bg-bg-glacial text-sm px-3 py-2 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>

                {/* Motivo de Perda */}
                <div>
                  <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Motivo da Perda</label>
                  <select
                    value={lossMotivoId}
                    onChange={(e) => setLossMotivoId(e.target.value as Id<"motivos_perda">)}
                    className="w-full bg-bg-glacial text-sm px-3 py-2 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
                  >
                    <option value="">Selecione o motivo...</option>
                    {motivosPerda?.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.descricao}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Observação */}
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Observações (Opcional)</label>
                  <textarea
                    placeholder="Ex: Embalagem furada / descartado por avaria..."
                    value={lossObservacao}
                    onChange={(e) => setLossObservacao(e.target.value)}
                    className="w-full bg-bg-glacial text-sm px-3 py-2 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary h-20 resize-none"
                  />
                </div>
              </div>

              {/* Botões do Modal */}
              <div className="flex items-center justify-end border-t border-[rgba(91,112,120,0.15)] pt-4 mt-4 space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLossModal(false);
                    setLossError(null);
                  }}
                  className="text-xs bg-bg-glacial text-ink-secondary hover:text-ink-primary font-semibold py-2 px-4 rounded-glacial border border-[rgba(91,112,120,0.15)] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={lossSaving}
                  className="text-xs bg-brand-primary text-white hover:bg-opacity-90 font-semibold py-2 px-4 rounded-glacial transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                >
                  {lossSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Registrar Perda</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
