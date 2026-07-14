import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Snowflake, PlusCircle, Truck, TrendingDown, LogOut, ArrowRight } from "lucide-react";

export default function Painel() {
  const [, setLocation] = useLocation();

  // Obter credenciais do localStorage
  const token = localStorage.getItem("colab_token") || "";
  const camaraId = localStorage.getItem("colab_camara_id") as Id<"camaras"> || "";
  const camaraSlug = localStorage.getItem("colab_camara_slug") || "";

  // Validar sessão no Convex
  const sessaoValidada = useQuery(
    api.operadores.validarSessao,
    token && camaraId ? { token, camaraId } : "skip"
  );

  const [tempoRestante, setTempoRestante] = useState("");

  // Efeito para validar e redirecionar se a sessão for inválida
  useEffect(() => {
    if (!token || !camaraId) {
      setLocation(`/colaborador/login${camaraSlug ? `?camara=${camaraSlug}` : ""}`);
      return;
    }

    if (sessaoValidada === null) {
      // Sessão expirou ou foi invalidada
      localStorage.clear();
      setLocation(`/colaborador/login${camaraSlug ? `?camara=${camaraSlug}` : ""}`);
    }
  }, [token, camaraId, sessaoValidada, setLocation, camaraSlug]);

  // Cronômetro regressivo da sessão de 12 horas
  useEffect(() => {
    const expiraEmStr = localStorage.getItem("colab_expira_em");
    if (!expiraEmStr) return;

    const expiraEm = parseInt(expiraEmStr);

    const updateTimer = () => {
      const diferenca = expiraEm - Date.now();
      if (diferenca <= 0) {
        setTempoRestante("Expirada");
        localStorage.clear();
        setLocation(`/colaborador/login${camaraSlug ? `?camara=${camaraSlug}` : ""}`);
        return;
      }

      const horas = Math.floor(diferenca / (1000 * 60 * 60));
      const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
      setTempoRestante(`${horas}h ${minutos}m restantes`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // atualiza a cada minuto

    return () => clearInterval(interval);
  }, [setLocation, camaraSlug]);

  const handleLogout = () => {
    localStorage.clear();
    setLocation(`/colaborador/login${camaraSlug ? `?camara=${camaraSlug}` : ""}`);
  };

  if (sessaoValidada === undefined || sessaoValidada === null) {
    return (
      <div className="min-h-screen bg-bg-glacial flex items-center justify-center p-6 text-center font-sans">
        <div className="text-sm text-ink-secondary">Validando sessão do operador...</div>
      </div>
    );
  }

  const { colaborador } = sessaoValidada;

  return (
    <div className="min-h-screen bg-bg-glacial font-sans flex flex-col justify-between py-6 px-4 sm:px-6">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
        
        {/* Top Header */}
        <header className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <Snowflake className="w-10 h-10 text-brand-primary" />
          </div>
          <p className="text-[10px] text-ink-secondary font-mono uppercase tracking-wider">Câmara Fria Ativa</p>
          <h1 className="text-xl font-extrabold text-ink-primary tracking-tight">
            {localStorage.getItem("colab_camara_nome")}
          </h1>
          
          <div className="mt-3 inline-flex items-center space-x-2 bg-surface-card px-3 py-1.5 rounded-full border border-[rgba(91,112,120,0.15)] text-xs">
            <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse"></span>
            <span className="font-semibold text-ink-primary">{colaborador.nome}</span>
            <span className="text-ink-secondary">|</span>
            <span className="text-ink-secondary font-mono">{tempoRestante}</span>
          </div>
        </header>

        {/* Menu de Ações Grandes (Mobile-First de 80px+ de altura) */}
        <main className="space-y-4">
          
          {/* Lançar Produção */}
          {(colaborador.permissao === "producao" || colaborador.permissao === "ambas") && (
            <button
              onClick={() => setLocation("/colaborador/lancar/producao")}
              className="w-full min-h-[96px] bg-surface-card hover:border-brand-primary active:bg-[rgba(14,124,156,0.05)] border border-[rgba(91,112,120,0.2)] rounded-glacial p-6 text-left flex items-center justify-between transition-all cursor-pointer shadow-glacial"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-glacial bg-brand-primary/10 flex items-center justify-center border border-brand-primary/10 text-brand-primary shrink-0">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-ink-primary">Lançar Produção</h2>
                  <p className="text-xs text-ink-secondary">Entrada de novos lotes de gelo</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-brand-primary shrink-0" />
            </button>
          )}

          {/* Lançar Carregamento */}
          {(colaborador.permissao === "saidas" || colaborador.permissao === "ambas") && (
            <button
              onClick={() => setLocation("/colaborador/lancar/carregamento")}
              className="w-full min-h-[96px] bg-surface-card hover:border-brand-success active:bg-brand-success-bg border border-[rgba(91,112,120,0.2)] rounded-glacial p-6 text-left flex items-center justify-between transition-all cursor-pointer shadow-glacial"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-glacial bg-brand-success/10 flex items-center justify-center border border-brand-success/10 text-brand-success shrink-0">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-ink-primary">Lançar Carregamento</h2>
                  <p className="text-xs text-ink-secondary">Saída de carga para vendas ou patrocínios</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-brand-success shrink-0" />
            </button>
          )}

          {/* Lançar Perda */}
          {(colaborador.permissao === "saidas" || colaborador.permissao === "ambas") && (
            <button
              onClick={() => setLocation("/colaborador/lancar/perda")}
              className="w-full min-h-[96px] bg-surface-card hover:border-brand-error active:bg-brand-error-bg border border-[rgba(91,112,120,0.2)] rounded-glacial p-6 text-left flex items-center justify-between transition-all cursor-pointer shadow-glacial"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-glacial bg-brand-error/10 flex items-center justify-center border border-brand-error/10 text-brand-error shrink-0">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-ink-primary">Lançar Perda</h2>
                  <p className="text-xs text-ink-secondary">Registrar gelo derretido, rasgado ou avariado</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-brand-error shrink-0" />
            </button>
          )}

        </main>

        {/* Botão de Finalizar Turno */}
        <div className="mt-8 text-center">
          <button
            onClick={handleLogout}
            className="text-xs text-ink-secondary hover:text-brand-error font-semibold py-2 px-6 rounded-glacial border border-[rgba(91,112,120,0.15)] hover:border-brand-error active:bg-brand-error-bg transition-all cursor-pointer inline-flex items-center justify-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Finalizar Turno (Logout)</span>
          </button>
        </div>

      </div>

      {/* Footer */}
      <footer className="text-center text-[10px] text-ink-secondary mt-8 font-mono">
        Estoque 065 &copy; 2026 — Sessão restrita e monitorada
      </footer>
    </div>
  );
}
