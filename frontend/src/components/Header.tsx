import React from 'react';
import { Sprout, RefreshCw, CloudOff, CheckCircle2, Sun } from 'lucide-react';

interface HeaderProps {
  backendConnected?: boolean | null;
  onRefreshBackend?: () => void;
  vpdLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({
  backendConnected,
  onRefreshBackend,
  vpdLabel = 'VPD 1.1 kPa · Óptimo',
}) => {
  return (
    <header className="px-6 pt-5 pb-3 flex items-center justify-between gap-3 border-b border-[#e2ebd9]/70 bg-white/45 backdrop-blur-xs sm:rounded-t-3xl">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <div
          id="brand-icon-box"
          className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#68875b] to-[#4f6d43] flex items-center justify-center shadow-sm shadow-[#4f6d43]/20"
        >
          <Sprout className="w-5 h-5 text-white sway-slow" strokeWidth={2.2} />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white">
            <span className="beacon-ping absolute inset-0 rounded-full bg-emerald-400" />
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-botanical text-xl sm:text-2xl font-bold tracking-tight text-[#253620]">
              Ayudante Botánico
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-[#e9f0e4] text-[#526b4a] rounded-full border border-[#d6e2cd]">
              SED + RAG
            </span>
          </div>
          <p className="text-xs text-[#647a5e] font-medium">
            Invernadero inteligente &amp; herbario guiado
          </p>
        </div>
      </div>

      {/* Right Status Pills */}
      <div className="flex items-center gap-2">
        <div
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#f6f9f3]/90 text-[#496342] border border-[#dbe7d3]"
          title="Déficit de Presión de Vapor promedio del invernadero"
        >
          <Sun className="w-3.5 h-3.5 text-amber-500 spin-slow" />
          <span>{vpdLabel}</span>
        </div>

        <button
          id="offline-status-pill"
          onClick={onRefreshBackend}
          title="Haz clic para verificar la conexión con el motor neuronal FastAPI"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer active:scale-95 ${
            backendConnected === true
              ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80'
              : backendConnected === false
              ? 'bg-amber-50/90 text-amber-800 border-amber-200 hover:bg-amber-100/80'
              : 'bg-[#f4f7f1] text-[#6d7c68] border-[#e2ebd9]'
          }`}
        >
          {backendConnected === true ? (
            <>
              <span className="relative flex w-2.5 h-2.5 items-center justify-center">
                <span className="beacon-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <CheckCircle2 className="relative w-3.5 h-3.5 text-emerald-600" />
              </span>
              <span className="hidden xs:inline">Motor IA</span> Activo
            </>
          ) : backendConnected === false ? (
            <>
              <CloudOff className="w-3.5 h-3.5 text-amber-600" />
              Motor Local
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#5a7552]" />
              Conectando...
            </>
          )}
        </button>
      </div>
    </header>
  );
};
