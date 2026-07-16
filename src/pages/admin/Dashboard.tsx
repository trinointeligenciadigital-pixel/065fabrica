import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Link } from "wouter";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Package,
  Layers,
  ThermometerSnowflake,
  ShieldCheck,
  Activity
} from "lucide-react";

type MovementType = "producao" | "venda" | "patrocinio" | "perda" | "ajuste" | "retorno_patrocinio";

export default function Dashboard() {
  const data = useQuery(api.estoque.obterDadosDashboard);

  // Estado para a barra selecionada no gráfico (tooltip em SVG responsivo)
  const [hoveredBar, setHoveredBar] = useState<{
    day: string;
    type: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  const [activeTabGrafico2, setActiveTabGrafico2] = useState<"saidas" | "perdas">("saidas");

  // Formatar datas
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Renderizar o badge de tipo de movimento
  const renderTipoBadge = (tipo: MovementType) => {
    const configs: Record<MovementType, { label: string; style: string }> = {
      producao: {
        label: "Produção",
        style: "bg-emerald-50 text-emerald-700 border-emerald-100"
      },
      venda: {
        label: "Venda",
        style: "bg-cyan-50 text-cyan-700 border-cyan-100"
      },
      patrocinio: {
        label: "Patrocínio",
        style: "bg-purple-50 text-purple-700 border-purple-100"
      },
      perda: {
        label: "Perda",
        style: "bg-rose-50 text-rose-700 border-rose-100"
      },
      ajuste: {
        label: "Ajuste",
        style: "bg-slate-50 text-slate-700 border-slate-100"
      },
      retorno_patrocinio: {
        label: "Retorno",
        style: "bg-indigo-50 text-indigo-700 border-indigo-100"
      }
    };

    const conf = configs[tipo] || { label: tipo, style: "bg-gray-50 text-gray-700 border-gray-100" };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${conf.style}`}>
        {conf.label}
      </span>
    );
  };

  if (!data) {
    return (
      <div className="text-center py-20 text-ink-secondary text-sm">
        Carregando painel de visão geral...
      </div>
    );
  }

  // Configurações do Gráfico SVG de Linha/Coluna
  const margin = { top: 25, right: 20, bottom: 35, left: 55 };
  const width = 600;
  const height = 220;
  const plotWidth = width - margin.left - margin.right; // 525
  const plotHeight = height - margin.top - margin.bottom; // 160

  // Valor máximo da escala
  const maxVal = Math.max(
    ...data.dados_grafico_7_dias.map((d) => Math.max(d.producao, d.vendas)),
    100
  );

  return (
    <div className="animate-fade-in space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-ink-primary tracking-tight">Painel Geral</h2>
        <p className="text-sm text-ink-secondary">Consolidação e monitoramento inteligente de estoque da fábrica.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Estoque Total */}
        <div className="glass-card interactive-card rounded-glacial p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Estoque Total</p>
            <h3 className="text-2xl font-bold text-ink-primary font-mono tracking-tight tabular-nums">
              {data.peso_total_estoque.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg
            </h3>
            <p className="text-[10px] text-ink-secondary font-medium">Soma física em todas as câmaras</p>
          </div>
          <div className="w-12 h-12 rounded-glacial bg-brand-primary/10 border border-brand-primary/10 flex items-center justify-center text-brand-primary">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Alertas de Reposição */}
        <div className="glass-card interactive-card rounded-glacial p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Alertas de Estoque</p>
            <h3 className={`text-2xl font-bold font-mono tracking-tight ${
              data.alertas_estoque_minimo.length > 0 ? "text-rose-600 animate-pulse" : "text-emerald-600"
            }`}>
              {data.alertas_estoque_minimo.length} {data.alertas_estoque_minimo.length === 1 ? "Produto" : "Produtos"}
            </h3>
            <p className="text-[10px] text-ink-secondary font-medium">Abaixo do limite de segurança</p>
          </div>
          <div className={`w-12 h-12 rounded-glacial flex items-center justify-center border ${
            data.alertas_estoque_minimo.length > 0 
              ? "bg-rose-50 border-rose-100 text-rose-600" 
              : "bg-emerald-50 border-emerald-100 text-emerald-600"
          }`}>
            {data.alertas_estoque_minimo.length > 0 ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
        </div>

        {/* Câmaras Ativas */}
        <div className="glass-card interactive-card rounded-glacial p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Câmaras Frias</p>
            <h3 className="text-2xl font-bold text-ink-primary font-mono tracking-tight">
              {data.total_camaras} Ativas
            </h3>
            <p className="text-[10px] text-ink-secondary font-medium">Controle de temperatura ativo</p>
          </div>
          <div className="w-12 h-12 rounded-glacial bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
            <ThermometerSnowflake className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Row: Gráficos SVG */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico 1: Evolução Semanal (2/3 da largura) */}
        <div className="lg:col-span-2 bg-surface-card rounded-glacial border border-slate-100 shadow-glacial p-5 flex flex-col justify-between interactive-card">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-brand-primary" />
                <h4 className="text-sm font-bold text-ink-primary">Fluxo de Gelo (Últimos 7 dias)</h4>
              </div>
              
              {/* Legenda do Gráfico */}
              <div className="flex items-center space-x-4 text-[10px] font-semibold text-ink-secondary">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-brand-primary block"></span>
                  <span>Produção (kg)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-500 block"></span>
                  <span>Vendas/Saídas (kg)</span>
                </div>
              </div>
            </div>

            {/* SVG Chart Area */}
            <div className="relative w-full overflow-hidden select-none">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Linhas de Grade e Eixo Y */}
                {[0, 1, 2, 3, 4].map((i) => {
                  const yVal = (maxVal / 4) * i;
                  const yPos = margin.top + plotHeight - (yVal / maxVal) * plotHeight;
                  return (
                    <g key={i}>
                      <line
                        x1={margin.left}
                        y1={yPos}
                        x2={width - margin.right}
                        y2={yPos}
                        stroke="rgba(91,112,120,0.08)"
                        strokeDasharray="3,3"
                      />
                      <text
                        x={margin.left - 8}
                        y={yPos + 3.5}
                        textAnchor="end"
                        style={{ fontSize: "9px", fontFamily: "var(--font-mono)", fill: "var(--color-ink-secondary)" }}
                        className="tabular-nums"
                      >
                        {Math.round(yVal)} kg
                      </text>
                    </g>
                  );
                })}

                {/* Plotando os dados por dia */}
                {data.dados_grafico_7_dias.map((d, idx) => {
                  const colWidth = plotWidth / 7;
                  const xPos = margin.left + colWidth * idx;

                  // Bar calculations
                  const barW = 12;
                  const gap = 3;
                  const startX = xPos + (colWidth - (barW * 2 + gap)) / 2;

                  // Produção
                  const prodH = (d.producao / maxVal) * plotHeight;
                  const prodY = margin.top + plotHeight - prodH;

                  // Vendas
                  const vendH = (d.vendas / maxVal) * plotHeight;
                  const vendY = margin.top + plotHeight - vendH;

                  return (
                    <g key={idx}>
                      {/* Eixo X labels */}
                      <text
                        x={xPos + colWidth / 2}
                        y={height - margin.bottom + 16}
                        textAnchor="middle"
                        style={{ fontSize: "9px", fontFamily: "var(--font-mono)", fill: "var(--color-ink-secondary)" }}
                      >
                        {d.data}
                      </text>

                      {/* Barra Produção */}
                      <rect
                        x={startX}
                        y={prodY}
                        width={barW}
                        height={prodH > 0 ? prodH : 2}
                        rx="2"
                        className="fill-brand-primary/80 hover:fill-brand-primary transition-all duration-200 cursor-pointer"
                        onMouseEnter={() =>
                          setHoveredBar({
                            day: d.data,
                            type: "Produção",
                            value: d.producao,
                            x: startX + barW / 2,
                            y: prodY
                          })
                        }
                        onMouseLeave={() => setHoveredBar(null)}
                      />

                      {/* Barra Vendas */}
                      <rect
                        x={startX + barW + gap}
                        y={vendY}
                        width={barW}
                        height={vendH > 0 ? vendH : 2}
                        rx="2"
                        className="fill-cyan-500/80 hover:fill-cyan-500 transition-all duration-200 cursor-pointer"
                        onMouseEnter={() =>
                          setHoveredBar({
                            day: d.data,
                            type: "Vendas",
                            value: d.vendas,
                            x: startX + barW + gap + barW / 2,
                            y: vendY
                          })
                        }
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                    </g>
                  );
                })}

                {/* SVG Vector Tooltip */}
                {hoveredBar && (
                  <g transform={`translate(${hoveredBar.x}, ${hoveredBar.y - 12})`} className="pointer-events-none">
                    <rect
                      x="-65"
                      y="-42"
                      width="130"
                      height="38"
                      rx="4"
                      fill="#12262C"
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="-26"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      style={{ fontSize: "9px", fontWeight: "bold" }}
                    >
                      Dia {hoveredBar.day}
                    </text>
                    <text
                      x="0"
                      y="-12"
                      textAnchor="middle"
                      fill="#EEF3F4"
                      style={{ fontSize: "9px", fontFamily: "var(--font-mono)" }}
                    >
                      {hoveredBar.type}: {hoveredBar.value.toLocaleString("pt-BR")} kg
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Desperdício e Distribuição de Saídas (1/3 da largura) */}
        <div className="bg-surface-card rounded-glacial border border-slate-100 shadow-glacial p-5 flex flex-col justify-between interactive-card">
          <div>
            {/* Abas de seleção */}
            <div className="flex items-center space-x-4 mb-4 border-b border-[rgba(91,112,120,0.08)] pb-2.5">
              <button
                onClick={() => setActiveTabGrafico2("saidas")}
                className={`text-xs font-bold pb-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTabGrafico2 === "saidas"
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-ink-secondary hover:text-ink-primary"
                }`}
              >
                Saídas (Geral)
              </button>
              <button
                onClick={() => setActiveTabGrafico2("perdas")}
                className={`text-xs font-bold pb-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTabGrafico2 === "perdas"
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-ink-secondary hover:text-ink-primary"
                }`}
              >
                Perdas (Detalhes)
              </button>
            </div>

            {activeTabGrafico2 === "saidas" ? (
              <div className="space-y-4">
                <p className="text-[10px] text-ink-secondary font-semibold uppercase tracking-wider">
                  Distribuição de Saídas (Últimos 30 dias)
                </p>
                
                {/* Segmented Progress Bar */}
                {(() => {
                  const consolidado = (data as any).consolidado_saidas || { vendas: 0, patrocinios: 0, perdas: 0, total: 0 };
                  const total = consolidado.total || 0;
                  const pctVenda = total > 0 ? Math.round((consolidado.vendas / total) * 100) : 0;
                  const pctPatrocinio = total > 0 ? Math.round((consolidado.patrocinios / total) * 100) : 0;
                  const pctPerda = total > 0 ? Math.round((consolidado.perdas / total) * 100) : 0;

                  return (
                    <>
                      {total > 0 ? (
                        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex border border-[rgba(91,112,120,0.05)] shadow-inner">
                          {consolidado.vendas > 0 && (
                            <div
                              className="h-full bg-cyan-500 hover:opacity-90 transition-all duration-300 cursor-help"
                              style={{ width: `${(consolidado.vendas / total) * 100}%` }}
                              title={`Vendas: ${pctVenda}%`}
                            />
                          )}
                          {consolidado.patrocinios > 0 && (
                            <div
                              className="h-full bg-purple-500 hover:opacity-90 transition-all duration-300 cursor-help"
                              style={{ width: `${(consolidado.patrocinios / total) * 100}%` }}
                              title={`Patrocínios/Eventos: ${pctPatrocinio}%`}
                            />
                          )}
                          {consolidado.perdas > 0 && (
                            <div
                              className="h-full bg-rose-500 hover:opacity-90 transition-all duration-300 cursor-help"
                              style={{ width: `${(consolidado.perdas / total) * 100}%` }}
                              title={`Perdas/Quebras: ${pctPerda}%`}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-3.5 bg-slate-100 rounded-full border border-[rgba(91,112,120,0.05)]" />
                      )}

                      <div className="space-y-3 mt-5">
                        <div className="flex items-center justify-between text-xs pb-2 border-b border-[rgba(91,112,120,0.04)]">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                            <span className="text-ink-primary font-medium">Vendas Comerciais</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-ink-primary">
                              {consolidado.vendas.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg
                            </span>
                            <span className="text-[10px] text-ink-secondary ml-1.5 font-semibold">
                              ({pctVenda}%)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pb-2 border-b border-[rgba(91,112,120,0.04)]">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                            <span className="text-ink-primary font-medium">Patrocínios & Eventos</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-ink-primary">
                              {consolidado.patrocinios.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg
                            </span>
                            <span className="text-[10px] text-ink-secondary ml-1.5 font-semibold">
                              ({pctPatrocinio}%)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pb-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                            <span className="text-ink-primary font-medium">Perdas & Quebras</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-rose-600">
                              {consolidado.perdas.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg
                            </span>
                            <span className="text-[10px] text-rose-500/80 ml-1.5 font-semibold">
                              ({pctPerda}%)
                            </span>
                          </div>
                        </div>

                        <div className="text-[10px] text-ink-secondary pt-3 text-center border-t border-[rgba(91,112,120,0.08)] font-semibold uppercase tracking-wider">
                          Total Expedido: {total.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div>
                {data.perdas_por_motivo.length === 0 ? (
                  <div className="text-center py-16 text-ink-secondary text-xs italic">
                    Sem perdas registradas no histórico.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
                    {data.perdas_por_motivo.map((item, idx) => (
                      <div key={idx} className="space-y-1 text-xs">
                        <div className="flex justify-between items-center font-medium">
                          <span className="text-ink-primary truncate max-w-[150px]" title={item.motivo}>
                            {item.motivo}
                          </span>
                          <span className="text-rose-600 font-bold font-mono">{item.porcentagem}%</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-[rgba(91,112,120,0.05)]">
                          <div
                            className="h-full bg-rose-500 rounded-full transition-all duration-500"
                            style={{ width: `${item.porcentagem}%` }}
                          />
                        </div>
                        <div className="text-[9px] text-ink-secondary text-right font-mono font-medium">
                          {item.quantidade_kg.toLocaleString("pt-BR")} kg perdidos
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Detail Grid: Alertas (Esq) / Atividades (Dir) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lado Esquerdo: Alertas de Reposição */}
        <div className="lg:col-span-2">
          
          {/* Alertas de Reposição */}
          <div className="bg-surface-card rounded-glacial border border-slate-100 shadow-glacial p-5 h-full flex flex-col justify-between interactive-card">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Layers className="w-4 h-4 text-ink-primary" />
                <h4 className="text-sm font-bold text-ink-primary">Alertas de Reposição de Estoque</h4>
              </div>

              {data.alertas_estoque_minimo.length === 0 ? (
                <div className="p-8 bg-emerald-50/50 border border-emerald-100 rounded-glacial flex items-center space-x-3 text-emerald-800 text-xs font-medium justify-center h-[180px]">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">Saldos de estoque estáveis</p>
                    <p className="text-emerald-700/80 mt-1">Todos os produtos estão com níveis acima do limite mínimo de segurança cadastrado.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {data.alertas_estoque_minimo.map((alert, idx) => (
                    <div
                      key={idx}
                      className={`p-3 border rounded-glacial flex items-center justify-between text-xs transition-all ${
                        alert.status === "Critico" 
                          ? "bg-rose-50/50 border-rose-150 text-rose-900" 
                          : "bg-amber-50/40 border-amber-150 text-amber-900"
                      }`}
                    >
                      <div>
                        <span className="font-bold block text-sm">{alert.produto_nome}</span>
                        <span className="text-[10px] opacity-80 mt-0.5 block">
                          Mínimo cadastrado: {alert.estoque_minimo} {alert.unidade}s
                        </span>
                      </div>
                      <div className="text-right">
                        {alert.status === "Critico" ? (
                          <span className="inline-flex px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[9px] uppercase tracking-wider animate-pulse mr-2">
                            Esgotado
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded bg-amber-500 text-white font-bold text-[9px] uppercase tracking-wider mr-2">
                            Baixo
                          </span>
                        )}
                        <span className="font-mono font-bold text-sm">{alert.saldo} {alert.unidade}s</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Lado Direito: Feed de Atividades Recentes */}
        <div className="space-y-6">
          <div className="bg-surface-card rounded-glacial border border-slate-100 shadow-glacial p-5 h-full flex flex-col justify-between interactive-card">
            <div>
              <div className="flex items-center justify-between border-b border-[rgba(91,112,120,0.1)] pb-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-ink-primary" />
                  <h4 className="text-sm font-bold text-ink-primary">Últimas Lançamentos</h4>
                </div>
              </div>

              {data.ultimas_movimentacoes.length === 0 ? (
                <div className="text-center py-12 text-ink-secondary text-xs">
                  Sem registros de movimentações recentes.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.ultimas_movimentacoes.map((mov, idx) => {
                    const saborDesc = mov.sabor_nome ? ` sabor ${mov.sabor_nome}` : "";
                    const formatoDesc = mov.formato_nome ? ` (${mov.formato_nome})` : "";
                    const fullDesc = `${mov.produto_nome}${saborDesc}${formatoDesc}`;
                    
                    return (
                      <div key={idx} className="text-xs space-y-1 pb-3 border-b border-[rgba(91,112,120,0.05)] last:border-0 last:pb-0">
                        <div className="flex justify-between items-center">
                          {renderTipoBadge(mov.tipo as MovementType)}
                          <span className="text-[10px] text-ink-secondary font-mono">{formatDateTime(mov.data_hora)}</span>
                        </div>
                        <p className="font-semibold text-ink-primary leading-tight">{fullDesc}</p>
                        <div className="flex justify-between text-[10px] text-ink-secondary mt-1">
                          <span>Operador: <span className="font-semibold">{mov.autor_id}</span></span>
                          <span className={`font-mono font-semibold ${mov.quantidade > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {mov.quantidade > 0 ? `+${mov.quantidade}` : mov.quantidade}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[rgba(91,112,120,0.1)]">
              <Link href="/admin/movimentacoes">
                <a className="w-full bg-bg-glacial text-ink-secondary hover:text-ink-primary font-bold text-xs py-2 rounded-glacial transition-all border border-[rgba(91,112,120,0.15)] flex items-center justify-center space-x-1.5 cursor-pointer">
                  <span>Auditar Histórico Completo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Estoque Detalhado por Câmara - Largura Total */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center space-x-2">
          <ThermometerSnowflake className="w-4 h-4 text-ink-primary" />
          <h4 className="text-sm font-bold text-ink-primary text-base">Estoque Físico por Câmara Fria</h4>
        </div>

        {data.estoque_detalhado.length === 0 ? (
          <div className="bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial p-8 text-center text-ink-secondary text-sm">
            Nenhum estoque localizado nas câmaras da fábrica.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.estoque_detalhado.map((cam, idx) => {
              const totalQtd = cam.itens.reduce((acc: number, item: any) => acc + item.quantidade, 0);
              
              return (
                <div
                  key={idx}
                  className="bg-surface-card rounded-glacial border border-slate-100 shadow-glacial p-5 flex flex-col justify-between interactive-card"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-[rgba(91,112,120,0.1)] pb-2.5 mb-3">
                      <span className="text-sm font-bold text-ink-primary">{cam.camara_nome}</span>
                      <span className="text-xs font-mono text-[10px] text-ink-secondary bg-bg-glacial px-2 py-0.5 rounded border border-[rgba(91,112,120,0.1)] shrink-0">
                        {totalQtd.toLocaleString("pt-BR")} itens
                      </span>
                    </div>
                    
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {cam.itens.map((item: any, itemIdx: number) => {
                        const saborDesc = item.sabor_nome ? ` sabor ${item.sabor_nome}` : "";
                        const formatoDesc = item.formato_nome ? ` (${item.formato_nome})` : "";
                        const fullDesc = `${item.produto_nome}${saborDesc}${formatoDesc}`;
                        const percentage = totalQtd > 0 ? Math.round((item.quantidade / totalQtd) * 100) : 0;

                        return (
                          <div key={itemIdx} className="space-y-1.5 py-1 border-b border-[rgba(91,112,120,0.05)] last:border-b-0">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-ink-secondary truncate max-w-[200px] font-medium" title={fullDesc}>
                                {fullDesc}
                              </span>
                              <span className="font-mono font-semibold text-ink-primary shrink-0 ml-2">
                                {item.quantidade.toLocaleString("pt-BR")} {item.unidade === "pacote" ? "pct" : "kg"}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                              <div
                                className="h-full bg-brand-primary rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
