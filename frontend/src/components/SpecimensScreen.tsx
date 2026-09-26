import React, { useState } from 'react';
import { 
  Droplets, 
  Thermometer, 
  Wind, 
  Activity, 
  Filter, 
  Search, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Sparkles,
  MapPin,
  Calendar
} from 'lucide-react';
import { Specimen, PlantStatus } from '../types';

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
    <div className="space-y-4 pb-4">
      {filteredSpecimens.length === 0 && (
      <div className="bg-white rounded-3xl p-8 text-center border border-[#dce7d5] space-y-3">
        <p className="text-[14px] font-medium text-[#5f7457]">
          No hay ejemplares registrados en tu jardín todavía.
        </p>
        <button
          onClick={onOpenNewSpecimen}
          className="bg-[#526b4a] hover:bg-[#43573c] text-white py-2 px-4 rounded-xl font-bold text-[12.5px] inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Plantar primer ejemplar</span>
        </button>
      </div>
      )}
      {/* Top bar with search and register button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
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
        <button
          id="btn-add-specimen-plantadas"
          onClick={onOpenNewSpecimen}
          className="bg-[#526b4a] hover:bg-[#43573c] text-white p-2 rounded-2xl shadow-2xs transition-all shrink-0"
          title="Agregar ejemplar"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap ${
            filter === 'all'
              ? 'bg-[#526b4a] text-white shadow-2xs'
              : 'bg-white text-[#576d51] border border-[#dbe6d3] hover:bg-[#eff4eb]'
          }`}
        >
          Todos ({specimens.length})
        </button>
        <button
          onClick={() => setFilter('critical')}
          className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
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
          className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
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
          className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            filter === 'stable'
              ? 'bg-[#10b981] text-white shadow-2xs'
              : 'bg-white text-[#059669] border border-[#a7f3d0] hover:bg-[#ecfdf5]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#10b981]" />
          Estables ({specimens.filter((s) => s.status === 'stable').length})
        </button>
      </div>

      {/* Specimens List */}
      <div id="specimens-list" className="space-y-3.5">
        {filteredSpecimens.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-[#dce7d5]">
            <p className="text-[14px] font-medium text-[#5f7457]">
              No se encontraron ejemplares con los criterios seleccionados.
            </p>
            <button
              onClick={() => {
                setFilter('all');
                setSearchQuery('');
              }}
              className="mt-3 text-[12px] font-semibold text-[#3b5433] underline"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          filteredSpecimens.map((specimen) => {
            const isCritical = specimen.status === 'critical';
            const isAttention = specimen.status === 'attention';
            const isWatering = wateringId === specimen.id;

            return (
              <div
                key={specimen.id}
                id={`specimen-card-${specimen.id}`}
                onClick={() => onSelectSpecimen(specimen)}
                className="bg-white rounded-[22px] overflow-hidden border border-[#dce7d5] shadow-2xs hover:shadow-xs hover:border-[#b9cca7] transition-all cursor-pointer group"
              >
                {/* Card Top: Image + Status Badges */}
                <div className="relative h-36 w-full bg-[#e3ecdc] overflow-hidden">
                  <img
                    src={specimen.imageUrl}
                    alt={specimen.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

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
                    <p className="text-[11.5px] italic text-white/90">
                      {specimen.scientificName} · {specimen.family}
                    </p>
                  </div>
                </div>

                {/* Card Body: Sensor readings & diagnostic highlights */}
                <div className="p-3.5 space-y-3">
                  {/* Alert banner if active */}
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

                  {/* Telemetría SED (HVS, TA, HR) y Salidas (PR, RF) */}
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

                  {/* Salidas del SED */}
                  <div className="flex items-center justify-between text-[11px] bg-[#eef4ea] px-2.5 py-1 rounded-lg text-[#32492a]">
                    <span>Prioridad Riego: <strong className={specimen.irrigationPriority > 65 ? 'text-[#dc2626] font-bold' : 'font-bold'}>{specimen.irrigationPriority}%</strong></span>
                    <span>Riesgo Fitosanitario: <strong className={specimen.phytosanitaryRisk > 75 ? 'text-[#dc2626] font-bold' : 'font-bold'}>{specimen.phytosanitaryRisk}%</strong></span>
                  </div>

                  {/* Soil moisture visual indicator bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-[#63795b]">
                      <span>Disponibilidad Hídrica</span>
                      <span>Último riego: {specimen.lastWatered}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#e4ede0] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          specimen.soilMoisture < 25
                            ? 'bg-[#ef4444]'
                            : specimen.soilMoisture < 40
                            ? 'bg-[#f59e0b]'
                            : 'bg-[#10b981]'
                        }`}
                        style={{ width: `${Math.min(specimen.soilMoisture * 1.4, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Action buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      id={`btn-water-${specimen.id}`}
                      onClick={(e) => handleWaterClick(e, specimen.id)}
                      disabled={isWatering}
                      className="flex-1 bg-[#eaf2e5] hover:bg-[#dcecd4] text-[#2c4224] text-[12px] font-semibold py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 border border-[#cbe0c3] transition-all active:scale-95"
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
                      className="flex-1 bg-white hover:bg-[#f6faf3] text-[#3d5435] text-[12px] font-semibold py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 border border-[#d2dfcb] transition-all active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#738e68]" />
                      <span>Diagnóstico SED</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
