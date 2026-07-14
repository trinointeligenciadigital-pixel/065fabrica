import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Snowflake, AlertTriangle, XCircle, User } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [camaraSlug, setCamaraSlug] = useState<string | null>(null);

  // Extrair o slug da câmara da URL query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("camara");
    setCamaraSlug(slug);
  }, []);

  // Obter detalhes da câmara
  const camara = useQuery(
    api.cadastros.obterCamaraPorSlug,
    camaraSlug ? { slug: camaraSlug } : "skip"
  );

  // Se tiver a câmara, lista os colaboradores autorizados
  const colaboradores = useQuery(
    api.operadores.obterColaboradoresPorCamara,
    camara ? { camaraId: camara._id } : "skip"
  );

  const loginOperador = useMutation(api.operadores.loginOperador);

  const [selectedColab, setSelectedColab] = useState<any>(null);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    setPin("");
  };

  // Dispara o login quando o PIN completa 4 dígitos
  useEffect(() => {
    if (pin.length === 4 && selectedColab && camara) {
      const triggerLogin = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await loginOperador({
            colaboradorId: selectedColab._id,
            camaraId: camara._id,
            pin,
          });

          // Salvar dados da sessão localmente
          localStorage.setItem("colab_token", res.token);
          localStorage.setItem("colab_nome", res.colaboradorName);
          localStorage.setItem("colab_camara_id", camara._id);
          localStorage.setItem("colab_camara_nome", camara.nome);
          localStorage.setItem("colab_camara_slug", camara.slug);
          localStorage.setItem("colab_expira_em", res.expiraEm.toString());

          // Redireciona para o painel operacional
          setLocation("/colaborador/painel");
        } catch (err: any) {
          setError(err.message || "Erro ao realizar o login.");
          setPin(""); // Limpa o PIN se falhar
        } finally {
          setLoading(false);
        }
      };

      triggerLogin();
    }
  }, [pin, selectedColab, camara, loginOperador, setLocation]);

  if (!camaraSlug) {
    return (
      <div className="min-h-screen bg-bg-glacial flex items-center justify-center p-6 text-center font-sans">
        <div className="w-full max-w-sm bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial p-8 flex flex-col items-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mb-4 shrink-0" />
          <h2 className="text-lg font-bold text-ink-primary mb-2">QR Code Necessário</h2>
          <p className="text-sm text-ink-secondary leading-relaxed">
            Para acessar os lançamentos, escaneie o QR Code afixado na porta da câmara fria correspondente.
          </p>
        </div>
      </div>
    );
  }

  if (camara === null) {
    return (
      <div className="min-h-screen bg-bg-glacial flex items-center justify-center p-6 text-center font-sans">
        <div className="w-full max-w-sm bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial p-8 flex flex-col items-center">
          <XCircle className="w-10 h-10 text-rose-500 mb-4 shrink-0" />
          <h2 className="text-lg font-bold text-brand-error mb-2">Câmara Fria Inválida</h2>
          <p className="text-sm text-ink-secondary leading-relaxed">
            O QR Code escaneado é inválido ou a câmara fria associada foi inativada pela gerência.
          </p>
        </div>
      </div>
    );
  }

  if (camara === undefined) {
    return (
      <div className="min-h-screen bg-bg-glacial flex items-center justify-center p-6 text-center font-sans">
        <div className="text-sm text-ink-secondary">Carregando dados da câmara...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-glacial font-sans flex flex-col justify-between py-8 px-4 sm:px-6">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
        
        {/* Header da Câmara */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <Snowflake className="w-10 h-10 text-brand-primary" />
          </div>
          <p className="text-[10px] text-ink-secondary font-mono uppercase tracking-wider">Acesso Operador</p>
          <h1 className="text-xl font-extrabold text-ink-primary tracking-tight">{camara.nome}</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-brand-error-bg text-brand-error border border-[rgba(201,58,66,0.15)] rounded-glacial text-xs font-semibold leading-relaxed text-left flex items-start">
            <AlertTriangle className="w-4 h-4 text-brand-error mr-2 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Passo 1: Selecionar o Operador */}
        {!selectedColab ? (
          <div className="bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial p-6">
            <h2 className="text-sm font-bold text-ink-primary mb-4 text-left">Selecione seu nome:</h2>
            {colaboradores === undefined ? (
              <p className="text-xs text-ink-secondary italic">Carregando operadores...</p>
            ) : colaboradores.length === 0 ? (
              <p className="text-xs text-brand-error italic text-left">
                Nenhum colaborador autorizado para esta câmara fria. Peça para o administrador associar seu usuário a esta câmara no painel administrativo.
              </p>
            ) : (
              <div className="space-y-3">
                {colaboradores.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => {
                      setSelectedColab(c);
                      setError(null);
                    }}
                    className="w-full text-left bg-bg-glacial border border-[rgba(91,112,120,0.15)] hover:border-brand-primary active:bg-[rgba(14,124,156,0.05)] rounded-glacial px-4 py-3.5 text-sm font-semibold text-ink-primary transition-all flex items-center justify-between cursor-pointer min-h-[56px]"
                  >
                    <span className="flex items-center">
                      <User className="w-4 h-4 text-ink-secondary mr-2 shrink-0" />
                      {c.nome}
                    </span>
                    <span className="text-xs text-ink-secondary uppercase tracking-wider text-[10px]">
                      {c.permissao === "ambas" ? "Prod/Saídas" : c.permissao}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Passo 2: Digitar PIN Pad */
          <div className="bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial p-6 flex flex-col items-center">
            
            {/* Operador Selecionado */}
            <div className="flex items-center justify-between w-full border-b border-[rgba(91,112,120,0.1)] pb-3 mb-6">
              <span className="text-sm font-bold text-ink-primary flex items-center">
                <User className="w-4 h-4 text-brand-primary mr-2 shrink-0" />
                {selectedColab.nome}
              </span>
              <button
                onClick={() => {
                  setSelectedColab(null);
                  setPin("");
                  setError(null);
                }}
                className="text-xs text-brand-primary font-semibold hover:underline cursor-pointer"
              >
                Alterar operador
              </button>
            </div>

            <p className="text-xs text-ink-secondary mb-4">Digite seu PIN de 4 dígitos:</p>

            {/* Display de PIN */}
            <div className="flex space-x-4 mb-8">
              {[0, 1, 2, 3].map((index) => {
                const filled = pin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-12 h-12 rounded-glacial border-2 flex items-center justify-center text-xl font-bold transition-all ${
                      filled
                        ? "border-brand-primary bg-[rgba(14,124,156,0.05)] text-brand-primary"
                        : "border-[rgba(91,112,120,0.2)] bg-bg-glacial text-ink-secondary"
                    }`}
                  >
                    {filled ? "•" : ""}
                  </div>
                );
              })}
            </div>

            {/* PIN Pad Teclado (Toques >= 56px) */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  disabled={loading}
                  onClick={() => handleKeyPress(num)}
                  className="w-full h-14 bg-bg-glacial border border-[rgba(91,112,120,0.15)] active:bg-[rgba(14,124,156,0.1)] active:border-brand-primary rounded-full font-bold text-lg text-ink-primary flex items-center justify-center transition-all cursor-pointer select-none"
                >
                  {num}
                </button>
              ))}
              <button
                disabled={loading}
                onClick={handleClear}
                className="w-full h-14 bg-bg-glacial border border-[rgba(91,112,120,0.15)] hover:border-brand-error active:bg-brand-error-bg rounded-full text-xs font-bold text-brand-error flex items-center justify-center transition-all cursor-pointer select-none"
              >
                LIMPAR
              </button>
              <button
                disabled={loading}
                onClick={() => handleKeyPress("0")}
                className="w-full h-14 bg-bg-glacial border border-[rgba(91,112,120,0.15)] active:bg-[rgba(14,124,156,0.1)] active:border-brand-primary rounded-full font-bold text-lg text-ink-primary flex items-center justify-center transition-all cursor-pointer select-none"
              >
                0
              </button>
              <button
                disabled={loading}
                onClick={handleDelete}
                className="w-full h-14 bg-bg-glacial border border-[rgba(91,112,120,0.15)] active:bg-[rgba(91,112,120,0.1)] rounded-full text-lg text-ink-secondary flex items-center justify-center transition-all cursor-pointer select-none"
              >
                ⌫
              </button>
            </div>
            
            {loading && (
              <div className="mt-4 text-xs text-brand-primary font-semibold animate-pulse">
                Validando credenciais...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-[10px] text-ink-secondary mt-8 font-mono">
        Estoque 065 &copy; 2026 — Lançamento Seguro na Origem
      </footer>
    </div>
  );
}
