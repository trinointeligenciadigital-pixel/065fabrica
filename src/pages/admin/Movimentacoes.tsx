import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Filter,
  RotateCcw,
  Search,
  X,
  Info,
  Clock,
  Download
} from "lucide-react";
import { exportToCSV } from "../../utils/export";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

type MovementType = "producao" | "venda" | "patrocinio" | "perda" | "ajuste" | "retorno_patrocinio";

export default function Movimentacoes() {
  // Query principal do histórico
  const historico = useQuery(api.estoque.listarMovimentacoesHistorico);
  
  // Queries auxiliares para popular os filtros
  const camaras = useQuery(api.cadastros.listarCamaras);
  const produtos = useQuery(api.cadastros.listarProdutos);

  // Queries auxiliares para o modal de produção
  const camarasAtivas = useQuery(api.cadastros.listarCamarasAtivas);
  const produtosAtivos = useQuery(api.cadastros.listarProdutosAtivos);
  const saboresAtivos = useQuery(api.cadastros.listarSaboresAtivos);
  const formatosAtivos = useQuery(api.cadastros.listarFormatosPacoteAtivos);

  // Estados dos filtros
  const [selectedCamara, setSelectedCamara] = useState<string>("");
  const [selectedProduto, setSelectedProduto] = useState<string>("");
  const [selectedTipo, setSelectedTipo] = useState<string>("");
  const [searchOperador, setSearchOperador] = useState<string>("");

  // Estados para o modal de lançamento de produção pelo Admin
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCamara, setModalCamara] = useState("");
  const [modalProduto, setModalProduto] = useState("");
  const [modalSabor, setModalSabor] = useState("");
  const [modalFormato, setModalFormato] = useState("");
  const [modalQuantidade, setModalQuantidade] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Mutation para registrar produção
  const lancarProducao = useMutation(api.estoque.lancarProducao);

  const selectedProdObj = produtosAtivos?.find(p => p._id === modalProduto);
  const produtoPrecisaSabor = selectedProdObj?.nome.toLowerCase().includes("saborizado");
  const produtoPrecisaFormato = selectedProdObj?.unidade === "pacote" && !produtoPrecisaSabor;

  // Filtro dinâmico para os produtos do dropdown de filtros baseados na câmara selecionada
  const selectedCamaraObj = camaras?.find(c => c.nome === selectedCamara);
  const produtosFiltradosDropdown = produtos?.filter((p) => {
    if (!selectedCamaraObj || !selectedCamaraObj.produtos_ids || selectedCamaraObj.produtos_ids.length === 0) {
      return true;
    }
    return selectedCamaraObj.produtos_ids.includes(p._id);
  });

  // Efeito para resetar o produto selecionado nos filtros caso mude a câmara e ele não pertença a ela
  useEffect(() => {
    if (selectedProduto && selectedCamaraObj && selectedCamaraObj.produtos_ids && selectedCamaraObj.produtos_ids.length > 0) {
      const prodNoFiltro = produtos?.find(p => p.nome === selectedProduto);
      if (prodNoFiltro && !selectedCamaraObj.produtos_ids.includes(prodNoFiltro._id)) {
        setSelectedProduto("");
      }
    }
  }, [selectedCamara, selectedProduto, selectedCamaraObj, produtos]);

  // Filtro de produtos para o modal de produção baseados na câmara do modal selecionada
  const selectedModalCamaraObj = camarasAtivas?.find(c => c._id === modalCamara);
  const produtosModalFiltrados = produtosAtivos?.filter((p) => {
    if (!selectedModalCamaraObj || !selectedModalCamaraObj.produtos_ids || selectedModalCamaraObj.produtos_ids.length === 0) {
      return true;
    }
    return selectedModalCamaraObj.produtos_ids.includes(p._id);
  });

  // Limpar produto selecionado no modal se a câmara do modal mudar
  useEffect(() => {
    setModalProduto("");
    setModalSabor("");
    setModalFormato("");
  }, [modalCamara]);

  const handleSubmitProducao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalCamara || !modalProduto || !modalQuantidade) {
      setModalError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const qtdVal = parseFloat(modalQuantidade);
    if (isNaN(qtdVal) || qtdVal <= 0) {
      setModalError("A quantidade deve ser maior que zero.");
      return;
    }

    setModalLoading(true);
    setModalError(null);
    try {
      await lancarProducao({
        camaraId: modalCamara as any,
        produtoId: modalProduto as any,
        saborId: (produtoPrecisaSabor && modalSabor) ? (modalSabor as any) : undefined,
        formatoPacoteId: (produtoPrecisaFormato && modalFormato) ? (modalFormato as any) : undefined,
        quantidade: qtdVal,
      });

      // Sucesso! Limpar form e fechar modal
      setModalCamara("");
      setModalProduto("");
      setModalSabor("");
      setModalFormato("");
      setModalQuantidade("");
      setModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || "Erro ao registrar produção.");
    } finally {
      setModalLoading(false);
    }
  };

  // Limpar filtros
  const handleResetFilters = () => {
    setSelectedCamara("");
    setSelectedProduto("");
    setSelectedTipo("");
    setSearchOperador("");
  };

  // Exportar CSV
  const handleExportCSV = () => {
    if (!filteredHistorico || filteredHistorico.length === 0) return;
    
    const headers = [
      "Data/Hora",
      "Câmara Fria",
      "Produto / Item",
      "Tipo de Lançamento",
      "Qtd Operação",
      "Peso Movimentado (kg)",
      "Autor / Operador"
    ];
    
    const data = filteredHistorico.map(m => {
      const saborDesc = m.sabor_nome ? ` sabor ${m.sabor_nome}` : "";
      const formatoDesc = m.formato_nome ? ` (${m.formato_nome})` : "";
      const fullDesc = `${m.produto_nome}${saborDesc}${formatoDesc}`;
      
      const tipoNomes: Record<string, string> = {
        producao: "Entrada (Produção)",
        venda: "Saída (Venda)",
        patrocinio: "Saída (Patrocínio)",
        perda: "Saída (Perda)",
        ajuste: m.quantidade > 0 ? "Ajuste (+)" : "Ajuste (-)",
        retorno_patrocinio: "Retorno Patrocínio"
      };

      return [
        formatDateTime(m.data_hora),
        m.camara_nome,
        fullDesc,
        tipoNomes[m.tipo] || m.tipo,
        m.quantidade,
        Math.abs(m.peso_total_kg),
        m.autor_id
      ];
    });

    exportToCSV("historico_movimentacoes", headers, data);
  };

  // Filtragem dos dados no cliente
  const filteredHistorico = historico?.filter((m) => {
    const matchCamara = !selectedCamara || m.camara_nome === selectedCamara;
    const matchProduto = !selectedProduto || m.produto_nome === selectedProduto;
    const matchTipo = !selectedTipo || m.tipo === selectedTipo;
    const matchOperador =
      !searchOperador ||
      m.autor_id.toLowerCase().includes(searchOperador.toLowerCase().trim());

    return matchCamara && matchProduto && matchTipo && matchOperador;
  });

  // Cálculos de KPIs baseados no histórico filtrado (em peso total kg)
  const stats = (() => {
    if (!filteredHistorico) return { producao: 0, saida: 0, perda: 0 };

    return filteredHistorico.reduce(
      (acc, m) => {
        const peso = Math.abs(m.peso_total_kg);
        
        if (m.tipo === "producao" || m.tipo === "retorno_patrocinio" || (m.tipo === "ajuste" && m.quantidade > 0)) {
          acc.producao += peso;
        } else if (m.tipo === "venda" || m.tipo === "patrocinio") {
          acc.saida += peso;
        } else if (m.tipo === "perda" || (m.tipo === "ajuste" && m.quantidade < 0)) {
          acc.perda += peso;
        }
        return acc;
      },
      { producao: 0, saida: 0, perda: 0 }
    );
  })();

  // Formatação de datas
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Renderizar o badge de tipo de movimento
  const renderTipoBadge = (tipo: MovementType, quantidade: number) => {
    const configs: Record<MovementType, { label: string; style: string }> = {
      producao: {
        label: "Entrada (Produção)",
        style: "bg-emerald-50 text-emerald-700 border-emerald-200/60"
      },
      venda: {
        label: "Saída (Venda)",
        style: "bg-cyan-50 text-cyan-700 border-cyan-200/60"
      },
      patrocinio: {
        label: "Saída (Patrocínio)",
        style: "bg-purple-50 text-purple-700 border-purple-200/60"
      },
      perda: {
        label: "Saída (Perda)",
        style: "bg-rose-50 text-rose-700 border-rose-200/60"
      },
      ajuste: {
        label: quantidade > 0 ? "Ajuste (+)" : "Ajuste (-)",
        style: "bg-slate-50 text-slate-700 border-slate-200/60"
      },
      retorno_patrocinio: {
        label: "Retorno Patrocínio",
        style: "bg-indigo-50 text-indigo-700 border-indigo-200/60"
      }
    };

    const conf = configs[tipo] || { label: tipo, style: "bg-gray-50 text-gray-700 border-gray-200/60" };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all ${conf.style}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          quantidade > 0 ? "bg-emerald-500" : "bg-rose-500"
        }`}></span>
        {conf.label}
      </span>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink-primary tracking-tight">Histórico de Movimentações</h2>
          <p className="text-sm text-ink-secondary">Monitore e audite todas as transações e fluxos de estoque da fábrica.</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="w-full sm:w-auto"
        >
          <span>➕</span>
          <span>Registrar Produção</span>
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Produzido */}
        <div className="bg-surface-card rounded-glacial border border-slate-100 shadow-glacial p-6 flex items-center justify-between interactive-card">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Entradas Totais</p>
            <h3 className="text-2xl font-bold text-ink-primary font-mono tracking-tight tabular-nums">
              {stats.producao.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg
            </h3>
            <p className="text-[10px] text-emerald-600 font-medium">Soma de produções e retornos</p>
          </div>
          <div className="w-12 h-12 rounded-glacial bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Saído / Vendido */}
        <div className="bg-surface-card rounded-glacial border border-slate-100 shadow-glacial p-6 flex items-center justify-between interactive-card">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Saídas de Carga</p>
            <h3 className="text-2xl font-bold text-ink-primary font-mono tracking-tight tabular-nums">
              {stats.saida.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg
            </h3>
            <p className="text-[10px] text-cyan-600 font-medium">Soma de vendas e patrocínios</p>
          </div>
          <div className="w-12 h-12 rounded-glacial bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Total Perdas */}
        <div className="bg-surface-card rounded-glacial border border-slate-100 shadow-glacial p-6 flex items-center justify-between interactive-card">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Descartes / Perdas</p>
            <h3 className="text-2xl font-bold text-ink-primary font-mono tracking-tight tabular-nums">
              {stats.perda.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg
            </h3>
            <p className="text-[10px] text-rose-600 font-medium">Quebras de estoque e avarias</p>
          </div>
          <div className="w-12 h-12 rounded-glacial bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface-card rounded-glacial border border-slate-100 shadow-glacial p-4 sm:p-5 mb-6 interactive-card">
        <div className="flex items-center space-x-2 mb-4 text-ink-primary">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-bold">Filtros de Lançamentos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Câmara Fria */}
          <div>
            <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Câmara Fria</label>
            <select
              value={selectedCamara}
              onChange={(e) => setSelectedCamara(e.target.value)}
              className="w-full bg-bg-glacial text-sm px-3 py-2 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
            >
              <option value="">Todas as câmaras</option>
              {camaras?.map((c) => (
                <option key={c._id} value={c.nome}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Produto */}
          <div>
            <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Produto</label>
            <select
              value={selectedProduto}
              onChange={(e) => setSelectedProduto(e.target.value)}
              className="w-full bg-bg-glacial text-sm px-3 py-2 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
            >
              <option value="">Todos os produtos</option>
              {produtosFiltradosDropdown?.map((p) => (
                <option key={p._id} value={p.nome}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Lançamento */}
          <div>
            <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Tipo de Lançamento</label>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="w-full bg-bg-glacial text-sm px-3 py-2 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
            >
              <option value="">Todos os tipos</option>
              <option value="producao">Entrada (Produção)</option>
              <option value="venda">Saída (Venda)</option>
              <option value="patrocinio">Saída (Patrocínio)</option>
              <option value="perda">Saída (Perda)</option>
              <option value="ajuste">Ajustes Físicos</option>
              <option value="retorno_patrocinio">Retorno Patrocínio</option>
            </select>
          </div>

          {/* Busca por Operador */}
          <div>
            <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Operador / Autor</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-secondary" />
              <input
                type="text"
                placeholder="Buscar por operador..."
                value={searchOperador}
                onChange={(e) => setSearchOperador(e.target.value)}
                className="w-full bg-bg-glacial text-sm pl-8 pr-8 py-1.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
              {searchOperador && (
                <button
                  onClick={() => setSearchOperador("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-secondary hover:text-ink-primary"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Ações de Filtro e Exportação */}
        <div className="mt-4 pt-4 border-t border-[rgba(91,112,120,0.1)] flex items-center justify-between">
          <button
            onClick={handleExportCSV}
            disabled={!filteredHistorico || filteredHistorico.length === 0}
            className="text-xs bg-bg-glacial text-ink-primary hover:bg-[rgba(91,112,120,0.05)] font-bold py-1.5 px-3 rounded-glacial border border-[rgba(91,112,120,0.15)] transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          {(selectedCamara || selectedProduto || selectedTipo || searchOperador) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-brand-primary font-bold hover:underline cursor-pointer flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-surface-card rounded-glacial border border-slate-100 shadow-glacial p-4 sm:p-6 overflow-x-auto interactive-card">
        {!historico ? (
          <div className="text-center py-12 text-ink-secondary text-sm">Carregando histórico...</div>
        ) : filteredHistorico && filteredHistorico.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
            <span className="text-4xl mb-3">🔍</span>
            <p className="text-sm font-semibold text-ink-primary">Nenhuma movimentação localizada</p>
            <p className="text-xs text-ink-secondary mt-1">Ajuste os filtros para ampliar a busca.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[rgba(91,112,120,0.15)] text-ink-secondary text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Data / Hora</th>
                <th className="py-3 px-4 font-semibold">Câmara</th>
                <th className="py-3 px-4 font-semibold">Tipo</th>
                <th className="py-3 px-4 font-semibold">Item / Descrição</th>
                <th className="py-3 px-4 font-semibold text-right">Qtd</th>
                <th className="py-3 px-4 font-semibold text-right">Peso (kg)</th>
                <th className="py-3 px-4 font-semibold">Autor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(91,112,120,0.1)] text-sm">
              {filteredHistorico?.map((m) => {
                // Concatenar nome do produto com sabor e formato se existirem
                const saborDesc = m.sabor_nome ? ` sabor ${m.sabor_nome}` : "";
                const formatoDesc = m.formato_nome ? ` (${m.formato_nome})` : "";
                const fullItemDesc = `${m.produto_nome}${saborDesc}${formatoDesc}`;

                return (
                  <tr key={m._id} className="hover:bg-[rgba(91,112,120,0.02)] transition-all">
                    {/* Data / Hora */}
                    <td className="py-3.5 px-4 text-ink-primary font-medium whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-ink-secondary/70" />
                        <span>{formatDateTime(m.data_hora)}</span>
                      </div>
                    </td>

                    {/* Câmara */}
                    <td className="py-3.5 px-4 text-ink-secondary font-medium">{m.camara_nome}</td>

                    {/* Tipo */}
                    <td className="py-3.5 px-4">{renderTipoBadge(m.tipo as MovementType, m.quantidade)}</td>

                    {/* Descrição do Item */}
                    <td className="py-3.5 px-4 text-ink-primary max-w-sm">
                      <div className="font-semibold leading-tight">{fullItemDesc}</div>
                      
                      {/* Sub-detalhes específicos de perdas */}
                      {m.tipo === "perda" && m.motivo_perda_descricao && (
                        <div className="text-[10px] text-rose-600 mt-1 flex items-center space-x-1 font-medium bg-rose-50 border border-rose-100 rounded px-1.5 py-0.5 w-max">
                          <Info className="w-3 h-3" />
                          <span>Motivo: {m.motivo_perda_descricao}</span>
                        </div>
                      )}
                    </td>

                    {/* Quantidade */}
                    <td className={`py-3.5 px-4 text-right font-mono font-semibold tabular-nums ${
                      m.quantidade > 0 ? "text-emerald-600" : "text-rose-600"
                    }`}>
                      {m.quantidade > 0 ? `+${m.quantidade}` : m.quantidade} {m.produto_unidade === "pacote" ? "pct" : "kg"}
                    </td>

                    {/* Peso Total */}
                    <td className={`py-3.5 px-4 text-right font-mono font-semibold tabular-nums ${
                      m.peso_total_kg > 0 ? "text-emerald-600" : "text-rose-600"
                    }`}>
                      {m.peso_total_kg > 0 ? `+${m.peso_total_kg.toFixed(1)}` : m.peso_total_kg.toFixed(1)} kg
                    </td>

                    {/* Autor */}
                    <td className="py-3.5 px-4 text-ink-secondary font-medium truncate max-w-[120px]" title={m.autor_id}>
                      {m.autor_id}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Registro de Produção */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              <span>❄️</span>
              <span>Registrar Entrada de Produção</span>
            </DialogTitle>
          </DialogHeader>

          {modalError && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-800 border border-rose-100 rounded text-xs font-semibold">
              {modalError}
            </div>
          )}

          <form onSubmit={handleSubmitProducao} className="space-y-4">
              {/* Câmara Fria */}
              <div>
                <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Câmara Fria *</label>
                <select
                  value={modalCamara}
                  onChange={(e) => setModalCamara(e.target.value)}
                  className="w-full bg-bg-glacial text-sm px-3 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer text-ink-primary"
                  required
                >
                  <option value="">Selecione a câmara</option>
                  {camarasAtivas?.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Produto */}
              <div>
                <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Produto *</label>
                <select
                  value={modalProduto}
                  onChange={(e) => {
                    setModalProduto(e.target.value);
                    setModalSabor("");
                    setModalFormato("");
                  }}
                  className="w-full bg-bg-glacial text-sm px-3 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer text-ink-primary"
                  required
                >
                  <option value="">Selecione o produto</option>
                  {produtosModalFiltrados?.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.nome} ({p.unidade === "pacote" ? "pacote" : "kg"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Saborizado Sabor Selection */}
              {produtoPrecisaSabor && (
                <div>
                  <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Sabor *</label>
                  <select
                    value={modalSabor}
                    onChange={(e) => setModalSabor(e.target.value)}
                    className="w-full bg-bg-glacial text-sm px-3 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer text-ink-primary"
                    required
                  >
                    <option value="">Selecione o sabor</option>
                    {saboresAtivos?.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Formato de Pacote Selection */}
              {produtoPrecisaFormato && (
                <div>
                  <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">Formato de Pacote *</label>
                  <select
                    value={modalFormato}
                    onChange={(e) => setModalFormato(e.target.value)}
                    className="w-full bg-bg-glacial text-sm px-3 py-2.5 rounded-glacial border border-[rgba(91,112,120,0.15)] focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer text-ink-primary"
                    required
                  >
                    <option value="">Selecione o formato</option>
                    {formatosAtivos?.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.nome} ({f.peso_kg} kg)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quantidade */}
              <div>
                <label className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block mb-1">
                  Quantidade ({selectedProdObj ? `${selectedProdObj.unidade}s` : "*"})
                </label>
                <Input
                  type="number"
                  step="any"
                  value={modalQuantidade}
                  onChange={(e) => setModalQuantidade(e.target.value)}
                  placeholder="Ex: 150"
                  required
                />
              </div>

              {/* Form Actions */}
              <div className="flex space-x-3 pt-3 border-t border-[rgba(91,112,120,0.1)]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setModalOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1"
                >
                  {modalLoading ? <span>Salvando...</span> : <span>Gravar Entrada</span>}
                </Button>
              </div>
            </form>
          </DialogContent>
      </Dialog>
    </div>
  );
}
