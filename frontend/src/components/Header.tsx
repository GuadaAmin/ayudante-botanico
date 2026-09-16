import React from 'react';
import { BookOpen, Server, RefreshCw } from 'lucide-react';

interface HeaderProps {
  backendConnected?: boolean | null;
  onRefreshBackend?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  backendConnected = null,
  onRefreshBackend
}) => {
  return (
    <header className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-[#e2ebd9]/70 bg-white/40 backdrop-blur-xs">
      {/* Brand Icon and Titles */}
      <div className="flex items-center gap-3">
        <div 
          id="brand-icon-box"
          className="w-10 h-10 rounded-2xl bg-[#dfead8] text-[#3d5734] flex items-center justify-center shadow-xs border border-[#cfddc7]"
        >
          <BookOpen className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <h1 className="text-[18px] font-bold tracking-tight text-[#22331d] leading-tight flex items-center gap-2">
            <span>Sistema Experto Botánico</span>
            <span className="text-[10.5px] font-semibold uppercase tracking-wider bg-[#dce9d4] text-[#2c4224] px-2 py-0.5 rounded-md">
              SED + RAG
            </span>
          </h1>
          <p className="text-[12px] font-medium text-[#5f7457]">
            Asesoramiento Fisiológico y Fitosanitario con Lógica Difusa y Recuperación Semántica
          </p>
        </div>
      </div>

      {/* Backend Online / Offline Status Badge */}
      <div className="flex items-center gap-2">
        <button
          id="offline-status-pill"
          onClick={onRefreshBackend}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all shadow-2xs border cursor-pointer ${
            backendConnected
              ? 'bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0] hover:bg-[#d1fae5]'
              : 'bg-[#fffbeb] text-[#92400e] border-[#fde68a] hover:bg-[#fef3c7]'
          }`}
          title="Estado de conexión con el backend FastAPI (puerto 8000)"
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              backendConnected === null
                ? 'bg-[#9ca3af] animate-ping'
                : backendConnected
                ? 'bg-[#10b981]'
                : 'bg-[#d97706] animate-pulse'
            }`}
          />
          <span>{backendConnected ? 'Backend FastAPI (8000)' : 'Backend Desconectado (Modo Local)'}</span>
          {onRefreshBackend && (
            <RefreshCw className="w-3.5 h-3.5 ml-0.5 opacity-60 hover:opacity-100" />
          )}
        </button>
      </div>
    </header>
  );
};
