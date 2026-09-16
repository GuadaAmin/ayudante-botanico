import React from 'react';
import { ChevronRight, Plus, Droplets, ShieldAlert, Sparkles, CheckCircle2, Bot } from 'lucide-react';
import { AlertInfo, Specimen } from '../types';

interface DashboardScreenProps {
  specimens: Specimen[];
  onOpenAlert: (alert: AlertInfo, specimen: Specimen) => void;
  onOpenCatalog: () => void;
  onOpenNewSpecimen: () => void;
  onSelectSpecimen: (specimen: Specimen) => void;
  onNavigateToPlantadas: (filter?: 'all' | 'stable' | 'attention' | 'critical') => void;
  onOpenChatbot?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  specimens,
  onOpenAlert,
  onOpenCatalog,
  onOpenNewSpecimen,
  onSelectSpecimen,
  onNavigateToPlantadas,
  onOpenChatbot
}) => {
  // Compute counts from current specimens
  const stableCount = specimens.filter((s) => s.status === 'stable').length;
  const attentionCount = specimens.filter((s) => s.status === 'attention').length;
  const criticalCount = specimens.filter((s) => s.status === 'critical').length;
  const totalMonitored = specimens.length;

  // Gather active alerts (>65% priority or active alert object)
  const activeAlerts: { alert: AlertInfo; specimen: Specimen }[] = [];
  specimens.forEach((specimen) => {
    if (specimen.activeAlert) {
      activeAlerts.push({ alert: specimen.activeAlert, specimen });
    }
  });

  const urgentCount = criticalCount + (attentionCount > 0 ? 1 : 0);

  return (
    <div className="space-y-4 pb-4">
      {/* SEMÁFORO GENERAL HERO BANNER WITH BOTANICAL GARDEN BACKGROUND */}
      <div 
        id="semaforo-general-card"
        className="relative overflow-hidden rounded-[26px] p-6 border border-[#2d4626]/20 shadow-md text-white min-h-[165px] flex flex-col justify-between"
      >
        {/* Real Botanical Garden Photo */}
        <img
          src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1200&q=80"
          alt="Jardín Botánico y Vivero de Flores"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Gentle dark gradient for optimal contrast and readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#132411]/95 via-[#1a2e16]/85 to-[#132411]/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[10.5px] font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-emerald-100 border border-white/10">
              🌿 Semáforo General del Jardín
            </span>
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-medium text-emerald-300 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SED Activo</span>
            </div>
          </div>
          <h2 className="font-botanical text-[30px] font-bold text-white leading-tight mt-2 drop-shadow-sm">
            Estado del Jardín
          </h2>
          <p className="text-[13px] text-emerald-50/90 mt-1 max-w-[88%] leading-snug drop-shadow-xs">
            {totalMonitored} ejemplares botánicos bajo monitoreo. {urgentCount > 0 ? `${urgentCount} requieren atención inmediata según las reglas difusas.` : 'Todos los canteros y ejemplares en balance hídrico óptimo.'}
          </p>
        </div>

        {/* Quick status pill bar inside hero */}
        <div className="relative z-10 mt-3 pt-2.5 border-t border-white/15 flex items-center gap-4 text-[11.5px] font-medium text-white/90 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" /> {stableCount} Óptimos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> {attentionCount} En Observación
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ef4444]" /> {criticalCount} Críticos
          </span>
        </div>
      </div>

      {/* METRIC COUNTERS (Estables, Atención, Crítico) */}
      <div id="status-summary-grid" className="grid grid-cols-3 gap-2.5">
        {/* Estables */}
        <button
          id="metric-estables-btn"
          onClick={() => onNavigateToPlantadas('stable')}
          className="bg-white rounded-2xl py-3 px-2 text-center border border-[#e3ebd9] shadow-2xs hover:border-[#b4caa7] transition-all group"
        >
          <span className="block text-[12px] font-medium text-[#64795c] group-hover:text-[#2d4224]">
            Estables
          </span>
          <span className="block text-[24px] font-bold text-[#23351d] my-0.5 leading-none">
            {stableCount}
          </span>
          <div className="flex justify-center mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
          </div>
        </button>

        {/* Atención */}
        <button
          id="metric-atencion-btn"
          onClick={() => onNavigateToPlantadas('attention')}
          className="bg-white rounded-2xl py-3 px-2 text-center border border-[#e3ebd9] shadow-2xs hover:border-[#fcd34d] transition-all group"
        >
          <span className="block text-[12px] font-medium text-[#64795c] group-hover:text-[#92400e]">
            Atención
          </span>
          <span className="block text-[24px] font-bold text-[#d97706] my-0.5 leading-none">
            {attentionCount}
          </span>
          <div className="flex justify-center mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
          </div>
        </button>

        {/* Crítico */}
        <button
          id="metric-critico-btn"
          onClick={() => onNavigateToPlantadas('critical')}
          className="bg-white rounded-2xl py-3 px-2 text-center border border-[#e3ebd9] shadow-2xs hover:border-[#fca5a5] transition-all group"
        >
          <span className="block text-[12px] font-medium text-[#64795c] group-hover:text-[#991b1b]">
            Crítico
          </span>
          <span className="block text-[24px] font-bold text-[#dc2626] my-0.5 leading-none">
            {criticalCount}
          </span>
          <div className="flex justify-center mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
          </div>
        </button>
      </div>

      {/* ACCESO DESTACADO AL CHATBOT SED */}
      {onOpenChatbot && (
        <div 
          id="chatbot-entry-card"
          onClick={onOpenChatbot}
          className="bg-gradient-to-r from-[#21331c] via-[#2a4324] to-[#3a5830] text-white rounded-2xl p-4 shadow-sm border border-[#23351d]/40 flex items-center justify-between gap-3 cursor-pointer hover:shadow-md hover:scale-[1.005] transition-all group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 group-hover:bg-white/25 transition-colors">
              <Bot className="w-5 h-5 text-emerald-300 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[14px] text-white">Chatbot Experto SED</span>
                <span className="bg-emerald-400/20 border border-emerald-400/30 text-emerald-200 text-[9.5px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Mamdani + RAG
                </span>
              </div>
              <p className="text-[11.5px] text-emerald-100/80 truncate mt-0.5">
                Chatea con el experto difuso, prueba tus valores o haz consultas de botánica
              </p>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 bg-white hover:bg-emerald-50 text-[#21331c] text-[11.5px] font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>Conversar</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* SECTION TITLE: Alertas SED Activas */}
      <div className="pt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-bold text-[#21331c] tracking-tight">
            Alertas SED Activas
          </h3>
          <span 
            id="alerts-count-badge"
            className="w-5 h-5 rounded-full bg-[#536b4a] text-white text-[11px] font-bold flex items-center justify-center"
          >
            {activeAlerts.length}
          </span>
        </div>
        <span className="text-[12px] font-medium text-[#6b8064]">
          Prioridad &gt; 65%
        </span>
      </div>

      {/* ALERT CARDS LIST */}
      <div id="alerts-list-container" className="space-y-2.5">
        {activeAlerts.length === 0 ? (
          <div className="p-6 bg-white rounded-2xl text-center border border-[#e2ebd9]">
            <CheckCircle2 className="w-8 h-8 mx-auto text-[#10b981] mb-2" />
            <p className="text-[14px] font-semibold text-[#24351e]">
              ¡Sin alertas críticas activas!
            </p>
            <p className="text-[12px] text-[#697d62] mt-1">
              Todos los ejemplares se encuentran dentro de los rangos óptimos calculados por el SED.
            </p>
          </div>
        ) : (
          activeAlerts.map(({ alert, specimen }) => {
            const isCritical = alert.severity === 'critical';
            const isPhyto = alert.type === 'phytosanitary';

            return (
              <div
                key={alert.id}
                id={`alert-card-${alert.id}`}
                onClick={() => onOpenAlert(alert, specimen)}
                className="group relative bg-white rounded-2xl p-3.5 border border-[#e2ebd9] shadow-2xs hover:border-[#b8ccae] hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Botanical flower/plant thumbnail preview */}
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[#d6e3cf] shadow-2xs bg-[#eef4ea]">
                    <img
                      src={specimen.imageUrl}
                      alt={specimen.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span
                      className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-xs ${
                        isCritical ? 'bg-[#ef4444]' : 'bg-[#f59e0b]'
                      }`}
                      title={isCritical ? 'Estado Crítico' : 'Estado de Atención'}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Specimen Name + Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[14.5px] text-[#22331d] truncate">
                        {specimen.name}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full tracking-tight ${
                          isPhyto
                            ? 'bg-[#fef3c7] text-[#b45309]'
                            : 'bg-[#fee2e2] text-[#dc2626]'
                        }`}
                      >
                        {alert.label}
                      </span>
                    </div>

                    {/* Reason text */}
                    <p className="text-[12.5px] text-[#465b40] mt-1 leading-snug">
                      {alert.reason}
                    </p>

                    {/* Numerical Stats footer */}
                    <div className="flex items-center gap-4 mt-1.5 text-[11.5px] text-[#657a5e]">
                      <span>
                        Prioridad Riego: <strong className="font-bold text-[#23351d]">{alert.irrigationPriority}%</strong>
                      </span>
                      <span>
                        Riesgo Fit.: <strong className="font-bold text-[#23351d]">{alert.phytosanitaryRisk}%</strong>
                      </span>
                    </div>
                  </div>

                  {/* Circular Chevron Action Button */}
                  <div className="shrink-0 self-center pl-1">
                    <div className="w-8 h-8 rounded-full bg-[#eef4ea] group-hover:bg-[#dce8d4] text-[#4a6341] flex items-center justify-center transition-colors">
                      <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* QUICK ACTION CARD: Registrar Nuevo Ejemplar */}
      <div
        id="quick-register-card"
        className="relative overflow-hidden rounded-[24px] bg-[#e1ebd8] p-3.5 border border-[#d2dec9] flex items-center justify-between gap-3 shadow-xs mt-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-11 h-11 rounded-2xl overflow-hidden shrink-0 border border-[#c5d6bd] shadow-2xs">
            <img
              src="https://images.unsplash.com/photo-1538998073820-4dfa76300194?auto=format&fit=crop&w=400&q=80"
              alt="Jardinería y Flores"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h4 className="text-[14px] font-bold text-[#20321b] leading-tight truncate">
              Registrar Nuevo Ejemplar
            </h4>
            <p className="text-[11.5px] text-[#546b4c] leading-tight truncate">
              Explorar especies del catálogo floral y arbóreo regional
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="quick-add-specimen-icon-btn"
            onClick={onOpenNewSpecimen}
            className="w-9 h-9 rounded-xl bg-[#526a49] hover:bg-[#43573c] text-white flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Registrar nuevo ejemplar"
          >
            <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
          </button>
          <button
            id="btn-ver-catalogo"
            onClick={onOpenCatalog}
            className="bg-white hover:bg-[#f6f9f3] text-[#334a2c] text-[12px] font-semibold px-3.5 py-2 rounded-full border border-[#cad7c2] shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            Ver Catálogo
          </button>
        </div>
      </div>
    </div>
  );
};
