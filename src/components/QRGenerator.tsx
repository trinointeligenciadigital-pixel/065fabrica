import { useState, useEffect } from "react";
import { QrCode, Printer, X, AlertTriangle, Snowflake } from "lucide-react";

interface QRGeneratorProps {
  nome: string;
  slug: string;
}

export default function QRGenerator({ nome, slug }: QRGeneratorProps) {
  const [showModal, setShowModal] = useState(false);
  const [ipOverride, setIpOverride] = useState("");
  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  // Carrega IP salvo do localStorage se houver (para não ter que digitar toda vez no dev)
  useEffect(() => {
    if (isLocalhost) {
      const savedIp = localStorage.getItem("dev_ip_override");
      if (savedIp) setIpOverride(savedIp);
    }
  }, [isLocalhost]);

  const handleIpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIpOverride(value);
    localStorage.setItem("dev_ip_override", value);
  };

  // Determina a base da URL
  let baseOrigin = window.location.origin;
  if (isLocalhost && ipOverride) {
    let cleanIp = ipOverride.trim();
    // Remove protocolo se digitado
    cleanIp = cleanIp.replace(/^https?:\/\//i, "");
    // Remove barra no final
    cleanIp = cleanIp.replace(/\/+$/, "");
    
    // Se já tiver uma porta especificada (ex: :5175), não adiciona a porta do window.location.port
    if (cleanIp.includes(":")) {
      baseOrigin = `http://${cleanIp}`;
    } else {
      baseOrigin = `http://${cleanIp}:${window.location.port}`;
    }
  }

  // URL para a qual o QR Code apontará
  const urlDeAcesso = `${baseOrigin}/colaborador/login?camara=${slug}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(urlDeAcesso)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Botão para abrir o visualizador de QR */}
      <button
        onClick={() => setShowModal(true)}
        className="text-xs bg-brand-primary text-white font-semibold py-1.5 px-3 rounded-glacial hover:bg-opacity-90 transition-all cursor-pointer flex items-center space-x-1.5"
      >
        <QrCode className="w-3.5 h-3.5" />
        <span>Gerar QR</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/40 backdrop-blur-sm print:p-0 print:bg-white print:relative print:z-0">
          <div className="relative w-full max-w-md bg-surface-card rounded-glacial border border-[rgba(91,112,120,0.15)] shadow-glacial p-6 print:border-0 print:shadow-none print:w-full print:max-w-none print:p-0">
            
            {/* Header - Escondido no print */}
            <div className="flex items-center justify-between mb-4 print:hidden">
              <h3 className="text-sm font-bold text-ink-primary">Etiqueta de Câmara</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-ink-secondary hover:text-ink-primary cursor-pointer p-1 rounded-lg hover:bg-bg-glacial transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

             {/* Alerta de Localhost no Modo de Desenvolvimento */}
            {isLocalhost && (
              <div className="mb-4 p-3 bg-brand-warning-bg text-brand-warning border border-[rgba(185,122,15,0.2)] rounded-glacial text-xs print:hidden">
                <p className="font-bold mb-1 flex items-center"><AlertTriangle className="w-4 h-4 mr-1.5 shrink-0" /> Ambiente de Desenvolvimento (Localhost)</p>
                <p className="leading-relaxed mb-2 text-ink-primary">
                  O celular não consegue acessar o endereço <code className="bg-white/80 px-1 rounded">localhost</code> do seu computador. Para testar no celular:
                </p>
                <ol className="list-decimal list-inside space-y-1 mb-2 text-ink-primary">
                  <li>Inicie o Vite com <code className="bg-white/80 px-1 rounded">npm run dev -- --host</code></li>
                  <li>Digite o IP do seu computador na rede local abaixo para atualizar o QR Code:</li>
                </ol>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-[10px] font-semibold text-ink-secondary">IP do Computador:</span>
                  <input
                    type="text"
                    value={ipOverride}
                    onChange={handleIpChange}
                    placeholder="Ex: 192.168.1.50"
                    className="flex-1 bg-white text-xs px-2.5 py-1 rounded border border-[rgba(91,112,120,0.2)] focus:outline-none focus:ring-1 focus:ring-brand-primary font-mono text-ink-primary"
                  />
                </div>
              </div>
            )}

            {/* Layout da Etiqueta para Impressão */}
            <div className="border-2 border-dashed border-ink-primary p-6 rounded-glacial text-center bg-white flex flex-col items-center print:border-4 print:border-solid print:p-12">
              <div className="mb-2 text-ink-primary">
                <Snowflake className="w-8 h-8 print:w-12 print:h-12" />
              </div>
              <h4 className="text-sm font-mono uppercase tracking-wider text-ink-secondary mb-1 print:text-lg">065 GELO</h4>
              
              <div className="bg-ink-primary text-white font-bold text-lg px-4 py-1.5 rounded-full mb-6 print:text-2xl print:px-8 print:py-3 print:mb-8">
                CÂMARA: {nome.toUpperCase()}
              </div>

              {/* QR Code */}
              <div className="border border-[rgba(91,112,120,0.15)] p-3 rounded-glacial mb-6 bg-white print:border-2 print:p-6 print:mb-8">
                <img
                  src={qrCodeUrl}
                  alt={`QR Code para câmara ${nome}`}
                  className="w-48 h-48 print:w-72 print:h-72"
                  crossOrigin="anonymous"
                />
              </div>

              <p className="text-[10px] text-ink-secondary leading-normal max-w-xs font-mono print:text-sm">
                Escaneie com a câmera do celular para realizar lançamentos nesta câmara.
              </p>
              
              <div className="text-[9px] text-ink-primary/60 font-mono mt-4 truncate max-w-full print:text-xs">
                {urlDeAcesso}
              </div>
            </div>

            {/* Actions - Escondido no print */}
            <div className="flex items-center justify-end space-x-2 mt-6 print:hidden">
              <button
                onClick={() => setShowModal(false)}
                className="text-xs bg-bg-glacial text-ink-secondary hover:text-ink-primary font-semibold py-2 px-4 rounded-glacial border border-[rgba(91,112,120,0.15)] transition-all cursor-pointer"
              >
                Fechar
              </button>
              <button
                onClick={handlePrint}
                className="text-xs bg-brand-primary text-white font-semibold py-2 px-4 rounded-glacial hover:bg-opacity-90 transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Etiqueta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos para impressão */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed, .fixed * {
            visibility: visible;
          }
          .fixed {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </>
  );
}
