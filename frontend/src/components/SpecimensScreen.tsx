import React, { useState } from 'react';
import { 
  Droplets, 
  Thermometer, 
  Wind, 
  Search, 
  Plus, 
  AlertTriangle, 
  AlertCircle,
  Sparkles,
  MapPin,
  LayoutGrid,
  List,
  Clock
} from 'lucide-react';
import { Specimen, PlantStatus } from '../types';

function estimateNextWatering(moisture: number, irrigationPriority: number): { label: string; urgent: boolean } {
  if (irrigationPriority > 70 || moisture < 25) {
    return { label: 'Inmediato (< 2h)', urgent: true };
  }
  if (irrigationPriority > 45 || moisture < 40) {
    return { label: 'En ~8 - 12h', urgent: false };
  }
  if (moisture < 60) {
    return { label: 'En 24 - 48h', urgent: false };
  }
  return { label: 'En 2 - 4 días', urgent: false };
}

interface SpecimensScreenProps {
  specimens: Specimen[];
  initialFilter?: 'all' | PlantStatus;
  onSelectSpecimen: (specimen: Specimen) => void;
  onWaterSpecimen: (specimenId: string) => void;
  onOpenNewSpecimen: () => void;
  onRunDiagnosis: (specimen: Specimen) => void;
}

export const SpecimensScreen: React.FC<SpecimensScreenProps> = ({
  specimens,
  initialFilter = 'all',
  onSelectSpecimen,
  onWaterSpecimen,
  onOpenNewSpecimen,
  onRunDiagnosis
}) => {
  const [filter, setFilter] = useState<'all' | PlantStatus>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [wateringId, setWateringId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'detailed' | 'grid'>('detailed');

  const filteredSpecimens = specimens.filter((s) => {
    const matchesFilter = filter === 'all' || s.status === filter;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleWaterClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setWateringId(id);
    setTimeout(() => {
      onWaterSpecimen(id);
      setWateringId(null);
    }, 600);
  };

  return (
    <div className="space-y-4 pb-4 tab-panel">
      {/* Top bar with search, view toggle and register button */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#72886d]" />
          <input
            id="search-specimens-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por ejemplar, especie o sector..."
            className="w-full bg-white pl-9 pr-3 py-2 text-[13px] rounded-2xl border border-[#dbe6d3] focus:outline-none focus:border-[#526b4a] transition-all text-[#22331d] placeholder:text-[#889d84]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#889d84] hover:text-[#22331d]"
            >
              ×
            </button>
          )}
        </div>

        {/* Toggle Vista Detallada / Cuadrícula */}
        <div className="inline-flex p-0.5 rounded-2xl bg-[#eef4ea] border border-[#d6e3cd] shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('detailed')}
            className={`px-2.5 py-1.5 rounded-xl text-[11.5px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'detailed'
                ? 'bg-white text-[#22331d] shadow-2xs'
                : 'text-[#5b7254] hover:text-[#22331d]'
            }`}
            title="Vista detallada"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Detallada</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-2.5 py-1.5 rounded-xl text-[11.5px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-[#22331d] shadow-2xs'
                : 'text-[#5b7254] hover:text-[#22331d]'
            }`}
            title="Vista en cuadrícula"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Cuadrícula</span>
          </button>
        </div>

        <button
          id="btn-add-specimen-plantadas"
          onClick={onOpenNewSpecimen}
          className="btn-shimmer bg-[#526b4a] hover:bg-[#43573c] text-white py-2 px-3 rounded-2xl shadow-2xs transition-all shrink-0 flex items-center gap-1.5 text-[12px] font-semibold cursor-pointer"
          title="Agregar ejemplar"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Plantar</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
            filter === 'all'
              ? 'bg-[#526b4a] text-white shadow-2xs'
              : 'bg-white text-[#576d51] border border-[#dbe6d3] hover:bg-[#eff4eb]'
          }`}
        >
          Todos ({specimens.length})
        </button>
        <button
          onClick={() => setFilter('critical')}
          className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            filter === 'critical'
              ? 'bg-[#dc2626] text-white shadow-2xs'
              : 'bg-white text-[#dc2626] border border-[#fca5a5] hover:bg-[#fef2f2]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
          Críticos ({specimens.filter((s) => s.status === 'critical').length})
        </button>
        <button
          onClick={() => setFilter('attention')}
          className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            filter === 'attention'
              ? 'bg-[#d97706] text-white shadow-2xs'
              : 'bg-white text-[#d97706] border border-[#fcd34d] hover:bg-[#fffbeb]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#d97706]" />
          Atención ({specimens.filter((s) => s.status === 'attention').length})
        </button>
        <button
          onClick={() => setFilter('stable')}
          className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            filter === 'stable'
              ? 'bg-[#10b981] text-white shadow-2xs'
              : 'bg-white text-[#059669] border border-[#a7f3d0] hover:bg-[#ecfdf5]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#10b981]" />
          Estables ({specimens.filter((s) => s.status === 'stable').length})
        </button>
      </div>

      {/* Specimens List / Grid */}
      <div
        id="specimens-list"
        className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3.5' : 'space-y-3.5'}
      >
        {filteredSpecimens.length === 0 ? (
          <div className="md:col-span-2 bg-white rounded-3xl p-8 text-center border border-[#dce7d5] space-y-3">
            <p className="text-[14px] font-medium text-[#5f7457]">
              {specimens.length === 0
                ? 'No hay ejemplares registrados en tu jardín todavía.'
                : 'No se encontraron ejemplares con los criterios seleccionados.'}
            </p>
            {specimens.length === 0 ? (
              <button
                onClick={onOpenNewSpecimen}
                className="bg-[#526b4a] hover:bg-[#43573c] text-white py-2 px-4 rounded-xl font-bold text-[12.5px] inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Plantar primer ejemplar</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setFilter('all');
                  setSearchQuery('');
                }}
                className="text-[12px] font-semibold text-[#3b5433] underline cursor-pointer"
              >
                Restablecer filtros
              </button>
            )}
          </div>
        ) : (
          filteredSpecimens.map((specimen) => {
            const isCritical = specimen.status === 'critical';
            const isAttention = specimen.status === 'attention';
            const isWatering = wateringId === specimen.id;
            const ringRadius = 18;
            const ringCircumference = 2 * Math.PI * ringRadius;
            const moisturePct = Math.max(0, Math.min(100, specimen.soilMoisture));
            const ringOffset = ringCircumference * (1 - moisturePct / 100);
            const ringStroke =
              specimen.soilMoisture < 25
                ? '#ef4444'
                : specimen.soilMoisture < 40
                ? '#f59e0b'
                : '#10b981';
            const nextWatering = estimateNextWatering(
              specimen.soilMoisture,
              specimen.irrigationPriority
            );

            return (
              <div
                key={specimen.id}
                id={`specimen-card-${specimen.id}`}
                onClick={() => onSelectSpecimen(specimen)}
                className="bg-white rounded-[22px] overflow-hidden border border-[#dce7d5] shadow-2xs hover:shadow-md hover:border-[#b9cca7] transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Card Top: Image + Status Badges + Falling Drops Overlay */}
                  <div className="relative h-36 w-full bg-[#e3ecdc] overflow-hidden">
                    <img
                      src={specimen.imageUrl}
                      alt={specimen.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/65 via-transparent to-transparent" />

                    {/* Animación de lluvia suave sobre la foto al regar */}
                    {isWatering && (
                      <div className="pointer-events-none absolute inset-0 bg-sky-500/20 backdrop-blur-[1px] flex items-center justify-around">
                        <svg viewBox="0 0 24 32" className="w-5 h-7 water-drop">
                          <path d="M12 2 C12 2 5 12 5 18 a7 7 0 0 0 14 0 C19 12 12 2 12 2 Z" fill="#38bdf8" />
                        </svg>
                        <svg viewBox="0 0 24 32" className="w-6 h-8 water-drop" style={{ animationDelay: '0.25s' }}>
                          <path d="M12 2 C12 2 5 12 5 18 a7 7 0 0 0 14 0 C19 12 12 2 12 2 Z" fill="#e0f2fe" />
                        </svg>
                        <svg viewBox="0 0 24 32" className="w-5 h-7 water-drop" style={{ animationDelay: '0.5s' }}>
                          <path d="M12 2 C12 2 5 12 5 18 a7 7 0 0 0 14 0 C19 12 12 2 12 2 Z" fill="#38bdf8" />
                        </svg>
                      </div>
                    )}

                    {/* Status pill top left */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] font-medium">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isCritical
                            ? 'bg-[#ef4444] animate-pulse'
                            : isAttention
                            ? 'bg-[#f59e0b]'
                            : 'bg-[#10b981]'
                        }`}
                      />
                      <span className="capitalize">
                        {isCritical ? 'Crítico' : isAttention ? 'Atención' : 'Estable'}
                      </span>
                    </div>

                    {/* Location pill top right */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[#2c3d25] text-[10.5px] font-medium shadow-xs">
                      <MapPin className="w-3 h-3 text-[#526b4a]" />
                      <span className="truncate max-w-[120px]">{specimen.location}</span>
                    </div>

                    {/* Bottom Image title */}
                    <div className="absolute bottom-2 left-3 right-3 text-white">
                      <h3 className="font-botanical text-[20px] font-bold leading-tight drop-shadow-xs">
                        {specimen.name}
                      </h3>
                      <p className="text-[11.5px] italic text-white/90 truncate">
                        {specimen.scientificName} · {specimen.family}
                      </p>
                    </div>
                  </div>

                  {/* Card Body: Sensor readings & radial hydration */}
                  <div className="p-3.5 space-y-3">
                    {specimen.activeAlert && (
                      <div
                        className={`rounded-xl px-3 py-1.5 flex items-start gap-2 text-[12px] font-medium ${
                          isCritical
                            ? 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'
                            : 'bg-[#fffbeb] text-[#92400e] border border-[#fde68a]'
                        }`}
                      >
                        {isCritical ? (
                          <AlertCircle className="w-4 h-4 text-[#dc2626] shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <span className="font-bold">{specimen.activeAlert.label}: </span>
                          <span>{specimen.activeAlert.reason}</span>
                        </div>
                      </div>
                    )}

                    {/* Telemetría SED (HVS, TA, HR) */}
                    <div className="grid grid-cols-3 gap-1.5 text-center bg-[#f5f8f3] p-2 rounded-xl border border-[#e5edd4]">
                      <div>
                        <div className="flex items-center justify-center gap-0.5 text-[10px] text-[#5e7456]">
                          <Droplets className="w-3 h-3 text-[#0284c7]" />
                          <span>HVS (Suelo)</span>
                        </div>
                        <span className={`text-[13px] font-bold ${specimen.soilMoisture < 25 ? 'text-[#dc2626]' : 'text-[#24351e]'}`}>
                          {specimen.soilMoisture}%
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-center gap-0.5 text-[10px] text-[#5e7456]">
                          <Thermometer className="w-3 h-3 text-[#ea580c]" />
                          <span>TA (Temp)</span>
                        </div>
                        <span className="text-[13px] font-bold text-[#24351e]">
                          {specimen.temperature}°C
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-center gap-0.5 text-[10px] text-[#5e7456]">
                          <Wind className="w-3 h-3 text-[#0d9488]" />
                          <span>HR (Amb.)</span>
                        </div>
                        <span className={`text-[13px] font-bold ${specimen.humidity > 80 ? 'text-[#d97706]' : 'text-[#24351e]'}`}>
                          {specimen.humidity}%
                        </span>
                      </div>
                    </div>

                    {/* Medidor Radial de Hidratación + Próximo Riego Estimado */}
                    <div className="flex items-center justify-between gap-2.5 bg-[#f8fbf5] px-3 py-2 rounded-xl border border-[#e3ede0]">
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 44 44" className="w-11 h-11 -rotate-90">
                            <circle cx="22" cy="22" r={ringRadius} fill="none" stroke="#e5efe0" strokeWidth="4" />
                            <circle
                              cx="22"
                              cy="22"
                              r={ringRadius}
                              fill="none"
                              stroke={ringStroke}
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeDasharray={ringCircumference}
                              strokeDashoffset={ringOffset}
                              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                            />
                          </svg>
                          <span className="absolute text-[10px] font-bold text-[#22331d]">
                            {moisturePct}%
                          </span>
                        </div>
                        <div className="text-[11px] leading-tight">
                          <p className="font-bold text-[#24351e]">Hidratación</p>
                          <p className="text-[#63795b]">Último: {specimen.lastWatered}</p>
                        </div>
                      </div>

                      <div
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold border ${
                          nextWatering.urgent
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-white text-[#415c38] border-[#d6e4ce]'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{nextWatering.label}</span>
                      </div>
                    </div>

                    {/* Salidas del SED */}
                    <div className="flex items-center justify-between text-[11px] bg-[#eef4ea] px-2.5 py-1 rounded-lg text-[#32492a]">
                      <span>Prioridad Riego: <strong className={specimen.irrigationPriority > 65 ? 'text-[#dc2626] font-bold' : 'font-bold'}>{specimen.irrigationPriority}%</strong></span>
                      <span>Riesgo Fitosanitario: <strong className={specimen.phytosanitaryRisk > 75 ? 'text-[#dc2626] font-bold' : 'font-bold'}>{specimen.phytosanitaryRisk}%</strong></span>
                    </div>
                  </div>
                </div>

                {/* Quick Action buttons */}
                <div className="px-3.5 pb-3.5 flex items-center gap-2">
                  <button
                    id={`btn-water-${specimen.id}`}
                    onClick={(e) => handleWaterClick(e, specimen.id)}
                    disabled={isWatering}
                    className="btn-shimmer flex-1 bg-[#eaf2e5] hover:bg-[#dcecd4] text-[#2c4224] text-[12px] font-semibold py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 border border-[#cbe0c3] transition-all active:scale-95 cursor-pointer"
                  >
                    <Droplets className={`w-3.5 h-3.5 text-[#0284c7] ${isWatering ? 'animate-bounce' : ''}`} />
                    <span>{isWatering ? 'Regando...' : 'Aplicar Riego'}</span>
                  </button>

                  <button
                    id={`btn-diagnose-${specimen.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRunDiagnosis(specimen);
                    }}
                    className="flex-1 bg-white hover:bg-[#f6faf3] text-[#3d5435] text-[12px] font-semibold py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 border border-[#d2dfcb] transition-all active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#738e68]" />
                    <span>Diagnóstico SED</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
