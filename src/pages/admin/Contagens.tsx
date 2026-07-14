import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  ClipboardCheck,
  Plus,
  Play,
  CheckCircle,
  X,
  FileText,
  Trash2,
  Calendar,
  User,
  Activity,
  ArrowLeft,
  Loader2,
  Info,
  Download
} from "lucide-react";
import { exportToCSV } from "../../utils/export";

export default function Contagens() {
  // Queries do Dashboard
  const camaras = useQuery(api.cadastros.listarCamarasAtivas);
  const contagensAtivas = useQuery(api.contagens.listarContagensAtivas);
  const historico = useQuery(api.contagens.listarHistoricoContagens);

  // Estado da câmara em contagem ativa
  const [selectedCamaraId, setSelectedCamaraId] = useState<Id<"camaras"> | null>(null);
  const [selectedCamaraNome, setSelectedCamaraNome] = useState<string>("");

  // Query da contagem ativa
  const activeContagem = useQuery(
    api.contagens.obterContagemAtiva,
    selectedCamaraId ? { camaraId: selectedCamaraId } : "skip"
  );

  // Estados locais da contagem ativa
  const [itensDigitados, setItensDigitados] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estado para ver detalhes de contagem passada
  const [detailsContagemId, setDetailsContagemId] = useState<Id<"contagens_fisicas"> | null>(null);
  const detalhesContagem = useQuery(
    api.contagens.obterDetalhesContagem,
    detailsContagemId ? { id: detailsContagemId } : "skip"
  );

  // Mutations
  const abrirContagem = useMutation(api.contagens.abrirContagem);
  const salvarRascunho = useMutation(api.contagens.salvarRascunhoContagem);
  const finalizarContagem = useMutation(api.contagens.finalizarContagem);
  const cancelarContagem = useMutation(api.contagens.cancelarContagem);

  // Inicializar o estado dos itens ao carregar a contagem ativa
  useEffect(() => {
    if (activeContagem) {
      setItensDigitados(activeContagem.itens);
    }
  }, [activeContagem]);

  // Handler para iniciar inventário
  const handleStartContagem = async (camaraId: Id<"camaras">, camaraNome: string) => {
    setError(null);
    try {
      setSaving(true);
      await abrirContagem({ camaraId });
      setSelectedCamaraId(camaraId);
      setSelectedCamaraNome(camaraNome);
    } catch (err: any) {
      setError(err.message || "Erro ao iniciar o inventário.");
    } finally {
      setSaving(false);
    }
  };

  // Handler para atualizar o input da contagem física
  const handleQtyChange = (index: number, valStr: string) => {
    const val = parseFloat(valStr);
    const cleanVal = isNaN(val) ? 0 : val;

    setItensDigitados((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const qtyContada = cleanVal < 0 ? 0 : cleanVal;
      const ajuste = qtyContada - item.quantidade_sistema;
      
      updated[index] = {
        ...item,
        quantidade_contada: qtyContada,
        ajuste_gerado: ajuste,
      };
      return updated;
    });
  };

  // Handler para salvar rascunho
  const handleSaveRascunho = async () => {
    if (!activeContagem) return;
    setError(null);
    setSuccessMsg(null);
    try {
      setSaving(true);
      // Sanitizar itens para bater com o schema (enviar apenas campos originais)
      const itensSanitizados = itensDigitados.map((i) => ({
        produto_id: i.produto_id,
        sabor_id: i.sabor_id,
        formato_pacote_id: i.formato_pacote_id,
        quantidade_sistema: i.quantidade_sistema,
        quantidade_contada: i.quantidade_contada,
        ajuste_gerado: i.ajuste_gerado,
      }));

      await salvarRascunho({
        id: activeContagem._id,
        itens: itensSanitizados,
      });
      setSuccessMsg("Rascunho do inventário salvo com sucesso!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar rascunho.");
    } finally {
      setSaving(false);
    }
  };

  // Handler para finalizar contagem
  const handleFinalizeContagem = async () => {
    if (!activeContagem) return;
    if (!window.confirm("Deseja realmente finalizar esta contagem? Esta ação gerará ajustes de estoque automáticos para todos os itens divergentes.")) return;
    
    setError(null);
    try {
      setSaving(true);
      const itensSanitizados = itensDigitados.map((i) => ({
        produto_id: i.produto_id,
        sabor_id: i.sabor_id,
        formato_pacote_id: i.formato_pacote_id,
        quantidade_sistema: i.quantidade_sistema,
        quantidade_contada: i.quantidade_contada,
        ajuste_gerado: i.ajuste_gerado,
      }));

      await finalizarContagem({
        id: activeContagem._id,
        itens: itensSanitizados,
      });
      
      // Resetar estados e retornar
      setSelectedCamaraId(null);
      setSelectedCamaraNome("");
      setItensDigitados([]);
      alert("Inventário finalizado com sucesso! O estoque foi ajustado.");
    } catch (err: any) {
      setError(err.message || "Erro ao finalizar inventário.");
    } finally {
      setSaving(false);
    }
  };

  // Handler para cancelar contagem
  const handleCancelContagem = async () => {
    if (!activeContagem) return;
    if (!window.confirm("Deseja realmente cancelar esta contagem? Todos os rascunhos digitados serão descartados e nenhum ajuste de estoque será feito.")) return;

    setError(null);
    try {
      setSaving(true);
      await cancelarContagem({ id: activeContagem._id });
      setSelectedCamaraId(null);
      setSelectedCamaraNome("");
      setItensDigitados([]);
    } catch (err: any) {
      setError(err.message || "Erro ao cancelar o inventário.");
    } finally {
      setSaving(false);
    }
  };

  // Exportar Relatório de Auditoria para CSV
  const handleExportAuditCSV = () => {
    if (!detalhesContagem || !detalhesContagem.itens) return;

    const headers = [
      "Item",
      "Qtd no Sistema (pct/kg)",
      "Qtd Contada Real",
      "Ajuste Gerado (Diferença)"
    ];

    const data = detalhesContagem.itens.map((item: any) => {
      const saborDesc = item.sabor_nome ? ` sabor ${item.sabor_nome}` : "";
      const formatoDesc = item.formato_nome ? ` (${item.formato_nome})` : "";
      const fullItemDesc = `${item.produto_nome}${saborDesc}${formatoDesc}`;

      return [
        fullItemDesc,
        item.quantidade_sistema,
        item.quantidade_contada,
        item.ajuste_gerado
      ];
    });

    const dataFechamento = new Date(detalhesContagem.fechada_em).toLocaleDateString("pt-BR").replace(/\//g, "-");
    const nomeArquivo = `auditoria_${detalhesContagem.camara_nome.replace(/\s+/g, "_").toLowerCase()}_${dataFechamento}`;

    exportToCSV(nomeArquivo, headers, data);
  };

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

  // Se estiver com câmara selecionada em inventário ativo, renderiza o checklist de contagem
  if (selectedCamaraId) {
    return (
      <div className="animate-fade-in">
        {/* Header da Contagem */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[rgba(91,112,120,0.15)] pb-6 mb-6 gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setSelectedCamaraId(null);
                setSelectedCamaraNome("");
              }}
              className="p-2 rounded-glacial bg-white border border-[rgba(91,112,120,0.15)] text-ink-secondary hover:text-ink-primary hover:bg-bg-glacial transition-all cursor-pointer"
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <h2 className="text-xl font-bold text-ink-primary">Inventário: {selectedCamaraNome}</h2>
              </div>
              {activeContagem && (
                <p className="text-xs text-ink-secondary mt-1">
                  Aberto por <span className="font-semibold">{activeContagem.aberta_por_id}</span> em {formatDateTime(activeContagem.aberta_em)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCancelContagem}
              disabled={saving}
              className="px-4 py-2 border border-brand-error text-brand-error hover:bg-brand-error-bg/30 text-xs font-semibold rounded-glacial transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Descartar</span>
            </button>
            <button
              onClick={handleSaveRascunho}
              disabled={saving}
              className="px-4 py-2 bg-white text-ink-primary border border-[rgba(91,112,120,0.15)] hover:bg-bg-glacial text-xs font-semibold rounded-glacial transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ClipboardCheck className="w-3.5 h-3.5" />}
              <span>Salvar Rascunho</span>
            </button>
            <button
              onClick={handleFinalizeContagem}
              disabled={saving}
              className="px-4 py-2 bg-brand-primary text-white hover:bg-opacity-90 text-xs font-semibold rounded-glacial transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Finalizar e Ajustar</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-brand-error-bg text-brand-error border border-[rgba(201,58,66,0.2)] rounded-glacial text-xs font-semibold mb-4 flex items-center space-x-2 animate-fade-in">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-brand-success-bg text-brand-success border border-[rgba(31,138,91,0.2)] rounded-glacial text-xs font-semibold mb-4 flex items-center space-x-2 animate-fade-in">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Checklist Table */}
        <div className="bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial p-4 sm:p-6">
          {!activeContagem ? (
            <div className="text-center py-12 text-ink-secondary text-sm">Carregando checklist de contagem...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[rgba(91,112,120,0.15)] text-ink-secondary text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Produto / Descrição</th>
                  <th className="py-3 px-4 font-semibold text-right">Estoque Sistema</th>
                  <th className="py-3 px-4 font-semibold text-center w-36">Quantidade Contada</th>
                  <th className="py-3 px-4 font-semibold text-right">Diferença / Ajuste</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(91,112,120,0.1)] text-sm">
                {itensDigitados.map((item, index) => {
                  const saborDesc = item.sabor_nome ? ` sabor ${item.sabor_nome}` : "";
                  const formatoDesc = item.formato_nome ? ` (${item.formato_nome})` : "";
                  const fullItemDesc = `${item.produto_nome}${saborDesc}${formatoDesc}`;

                  const diff = item.quantidade_contada - item.quantidade_sistema;

                  return (
                    <tr key={index} className="hover:bg-[rgba(91,112,120,0.02)] transition-all">
                      {/* Descrição */}
                      <td className="py-4 px-4 font-medium text-ink-primary">{fullItemDesc}</td>

                      {/* Estoque Sistema */}
                      <td className="py-4 px-4 text-right font-mono text-ink-secondary tabular-nums">
                        {item.quantidade_sistema} {item.produto_unidade === "pacote" ? "pct" : "kg"}
                      </td>

                      {/* Qtd Contada (Input) */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.quantidade_contada}
                            onChange={(e) => handleQtyChange(index, e.target.value)}
                            className="w-24 text-center font-mono font-bold text-ink-primary bg-bg-glacial border border-[rgba(91,112,120,0.15)] rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                          />
                        </div>
                      </td>

                      {/* Ajuste Diferença */}
                      <td className="py-4 px-4 text-right">
                        {diff === 0 ? (
                          <span className="text-xs text-ink-secondary font-semibold">Sem divergência</span>
                        ) : (
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold font-mono ${
                            diff > 0 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}>
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // Dashboard de Câmaras Frias & Histórico de Auditorias
  return (
    <div className="animate-fade-in">
      {/* Title */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-ink-primary tracking-tight">Contagem Física</h2>
        <p className="text-sm text-ink-secondary">Audite e equalize o saldo de estoque físico com o sistema da fábrica.</p>
      </div>

      {/* Grid de Câmaras Frias para Inventário */}
      <div className="mb-10">
        <div className="flex items-center space-x-2 mb-6">
          <Activity className="w-5 h-5 text-ink-primary" />
          <h3 className="text-base font-bold text-ink-primary">Auditoria por Câmara Fria</h3>
        </div>

        {!camaras ? (
          <div className="text-center py-8 text-ink-secondary text-sm">Carregando câmaras...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {camaras.map((cam) => {
              // Verificar se a câmara tem contagem aberta
              const aberta = contagensAtivas?.find((c) => c.camara_id === cam._id);

              return (
                <div
                  key={cam._id}
                  className="bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial p-5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-ink-primary">{cam.nome}</span>
                      <span className="text-2xl">❄️</span>
                    </div>

                    {aberta ? (
                      <div className="inline-flex items-center space-x-1.5 bg-amber-50 border border-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        <span>Inventário Aberto</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center space-x-1.5 bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        <span>Aguardando Auditoria</span>
                      </div>
                    )}

                    <p className="text-xs text-ink-secondary pt-1">
                      {aberta 
                        ? `Iniciado por ${aberta.aberta_por_id} em ${formatDateTime(aberta.aberta_em)}.`
                        : "Câmara pronta para contagem e verificação física."}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[rgba(91,112,120,0.1)]">
                    {aberta ? (
                      <button
                        onClick={() => {
                          setSelectedCamaraId(cam._id);
                          setSelectedCamaraNome(cam.nome);
                        }}
                        className="w-full bg-amber-500 text-white hover:bg-amber-600 text-xs font-semibold py-2 rounded-glacial transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-sm"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Continuar Contagem</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartContagem(cam._id, cam.nome)}
                        disabled={saving}
                        className="w-full bg-brand-primary text-white hover:bg-opacity-90 text-xs font-semibold py-2 rounded-glacial transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Iniciar Auditoria</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Histórico de Auditorias */}
      <div>
        <div className="flex items-center space-x-2 mb-6">
          <FileText className="w-5 h-5 text-ink-primary" />
          <h3 className="text-base font-bold text-ink-primary">Histórico de Auditorias Fechadas</h3>
        </div>

        <div className="bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial p-4 sm:p-6 overflow-x-auto">
          {!historico ? (
            <div className="text-center py-8 text-ink-secondary text-sm">Carregando histórico...</div>
          ) : historico.length === 0 ? (
            <div className="text-center py-12 text-ink-secondary text-sm">Nenhuma auditoria realizada anteriormente.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[rgba(91,112,120,0.15)] text-ink-secondary text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Câmara Fria</th>
                  <th className="py-3 px-4 font-semibold">Fechamento</th>
                  <th className="py-3 px-4 font-semibold">Responsável</th>
                  <th className="py-3 px-4 font-semibold text-center">Itens Divergentes</th>
                  <th className="py-3 px-4 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(91,112,120,0.1)] text-sm">
                {historico.map((h) => (
                  <tr key={h._id} className="hover:bg-[rgba(91,112,120,0.02)] transition-all">
                    {/* Câmara */}
                    <td className="py-3.5 px-4 font-bold text-ink-primary">{h.camara_nome}</td>

                    {/* Data Fechamento */}
                    <td className="py-3.5 px-4 text-ink-secondary">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-ink-secondary/70" />
                        <span>{formatDateTime(h.fechada_em)}</span>
                      </div>
                    </td>

                    {/* Responsável */}
                    <td className="py-3.5 px-4 text-ink-secondary">
                      <div className="flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-ink-secondary/70" />
                        <span>{h.fechada_por_id}</span>
                      </div>
                    </td>

                    {/* Qtd Divergências */}
                    <td className="py-3.5 px-4 text-center">
                      {h.total_divergencias === 0 ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Acurácia 100%
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                          {h.total_divergencias} {h.total_divergencias === 1 ? "divergência" : "divergências"}
                        </span>
                      )}
                    </td>

                    {/* Botão Ver Detalhes */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setDetailsContagemId(h._id)}
                        className="text-xs text-brand-primary font-bold hover:underline cursor-pointer flex items-center justify-end space-x-1 ml-auto"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Ver Relatório</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal - Detalhes / Relatório de Auditoria Fechada */}
      {detailsContagemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/30 backdrop-blur-[2px] transition-all animate-fade-in">
          <div className="w-full max-w-2xl bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial p-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-[rgba(91,112,120,0.15)] pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-ink-primary">Relatório de Auditoria Física</h3>
                {detalhesContagem && (
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Câmara: <span className="font-semibold">{detalhesContagem.camara_nome}</span> • Fechado por {detalhesContagem.fechada_por_id} em {formatDateTime(detalhesContagem.fechada_em)}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportAuditCSV}
                  className="text-xs bg-bg-glacial text-ink-primary hover:bg-[rgba(91,112,120,0.05)] font-bold py-1.5 px-3 rounded-glacial border border-[rgba(91,112,120,0.15)] transition-all cursor-pointer flex items-center space-x-1.5"
                  title="Baixar CSV do Relatório"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exportar</span>
                </button>
                <button
                  onClick={() => setDetailsContagemId(null)}
                  className="text-ink-secondary hover:text-brand-error cursor-pointer p-1 text-lg font-bold transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!detalhesContagem ? (
              <div className="text-center py-12 text-ink-secondary text-sm">Carregando relatório...</div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-96 overflow-y-auto pr-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[rgba(91,112,120,0.15)] text-ink-secondary text-[10px] uppercase tracking-wider">
                        <th className="py-2.5 px-3 font-semibold">Item</th>
                        <th className="py-2.5 px-3 font-semibold text-right">No Sistema</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Contado Real</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Ajuste Ledger</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(91,112,120,0.1)] text-xs">
                      {detalhesContagem.itens.map((item, idx) => {
                        const saborDesc = item.sabor_nome ? ` sabor ${item.sabor_nome}` : "";
                        const formatoDesc = item.formato_nome ? ` (${item.formato_nome})` : "";
                        const fullItemDesc = `${item.produto_nome}${saborDesc}${formatoDesc}`;

                        return (
                          <tr key={idx} className="hover:bg-[rgba(91,112,120,0.02)] transition-all">
                            <td className="py-2.5 px-3 font-medium text-ink-primary">{fullItemDesc}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-ink-secondary tabular-nums">
                              {item.quantidade_sistema} {item.produto_unidade === "pacote" ? "pct" : "kg"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-ink-primary tabular-nums">
                              {item.quantidade_contada} {item.produto_unidade === "pacote" ? "pct" : "kg"}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {item.ajuste_gerado === 0 ? (
                                <span className="text-[10px] text-ink-secondary/70">OK (Estável)</span>
                              ) : (
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                                  item.ajuste_gerado > 0 
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                    : "bg-rose-50 text-rose-700 border border-rose-100"
                                }`}>
                                  {item.ajuste_gerado > 0 ? `+${item.ajuste_gerado}` : item.ajuste_gerado}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center space-x-2 border-t border-[rgba(91,112,120,0.1)] pt-4 text-xs text-ink-secondary bg-bg-glacial/50 p-3 rounded">
                  <Info className="w-4 h-4 text-brand-primary shrink-0" />
                  <span>
                    Todas as divergências listadas acima geraram lançamentos automáticos de acerto de estoque em data/hora correspondentes na aba de movimentações.
                  </span>
                </div>

                <div className="flex items-center justify-end mt-4">
                  <button
                    onClick={() => setDetailsContagemId(null)}
                    className="text-xs bg-bg-glacial text-ink-secondary hover:text-ink-primary font-semibold py-2 px-4 rounded-glacial border border-[rgba(91,112,120,0.15)] transition-all cursor-pointer"
                  >
                    Fechar Relatório
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
