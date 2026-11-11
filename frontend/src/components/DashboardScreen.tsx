import React, { useMemo, useState } from 'react';
import {
  Droplets,
  Thermometer,
  Wind,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  BookOpen,
  Plus,
  ArrowRight,
  Sparkles,
  MapPin,
  Activity,
  Bot,
} from 'lucide-react';
import { AlertInfo, PlantStatus, Specimen } from '../types';

interface DashboardScreenProps {
  specimens: Specimen[];
  onOpenAlert: (alert: AlertInfo, specimen: Specimen) => void;
  onOpenCatalog: () => void;
  onOpenNewSpecimen: () => void;
  onSelectSpecimen: (specimen: Specimen) => void;
  onNavigateToPlantadas: (filter: PlantStatus | 'all') => void;
  onOpenChatbot: () => void;
  onWaterSpecimen?: (specimenId: string) => void;
  onResolvePhyto?: (specimenId: string) => void;
}

const CHART_HOURS = ['00h', '04h', '08h', '12h', '16h', '20h', 'Ahora'];

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  specimens,
  onOpenAlert,
  onOpenCatalog,
  onOpenNewSpecimen,
  onSelectSpecimen,
  onNavigateToPlantadas,
  onOpenChatbot,
  onWaterSpecimen,
  onResolvePhyto,
}) => {
  const [chartMetric, setChartMetric] = useState<'hvs' | 'ta'>('hvs');

  const stats = useMemo(() => {
    const total = specimens.length || 1;
    const stable = specimens.filter((s) => s.status === 'stable');
    const attention = specimens.filter((s) => s.status === 'attention');
    const critical = specimens.filter((s) => s.status === 'critical');

    const avgMoisture = Math.round(
      specimens.reduce((acc, s) => acc + s.soilMoisture, 0) / total
    );
    const avgTemp = +(
      specimens.reduce((acc, s) => acc + s.temperature, 0) / total
    ).toFixed(1);
    const avgHumidity = Math.round(
      specimens.reduce((acc, s) => acc + s.humidity, 0) / total
    );

    const rawScore =
      specimens.length === 0
        ? 100
        : Math.round(((stable.length + attention.length * 0.55) / specimens.length) * 100);

    const activeAlerts = specimens.filter(
      (s) => s.activeAlert || s.status !== 'stable'
    );

    const sectorMap = new Map<string, Specimen[]>();
    specimens.forEach((sp) => {
      const key = sp.location || 'Sector General';
      const existing = sectorMap.get(key) || [];
      existing.push(sp);
      sectorMap.set(key, existing);
    });

    return {
      total: specimens.length,
      stableCount: stable.length,
      attentionCount: attention.length,
      criticalCount: critical.length,
      avgMoisture,
      avgTemp,
      avgHumidity,
      healthScore: Math.max(0, Math.min(100, rawScore)),
      activeAlerts,
      sectors: Array.from(sectorMap.entries()),
    };
  }, [specimens]);

  // Curva de tendencia 24h anclada en los promedios en vivo
  const chartData = useMemo(() => {
    if (chartMetric === 'hvs') {
      const anchor = stats.avgMoisture || 54;
      const points = [
        Math.min(95, anchor + 9),
        Math.min(95, anchor + 11),
        Math.min(95, anchor + 6),
        Math.max(12, anchor - 5),
        Math.max(12, anchor - 8),
        Math.max(12, anchor - 2),
        anchor,
      ];
      return { points, unit: '%', minBound: 0, maxBound: 100, stroke: '#0ea5e9', fill: 'rgba(14, 165, 233, 0.14)' };
    }
    const anchor = stats.avgTemp || 23.5;
    const points = [
      Math.max(10, +(anchor - 4.2).toFixed(1)),
      Math.max(10, +(anchor - 5.1).toFixed(1)),
      Math.max(10, +(anchor - 2.3).toFixed(1)),
      Math.min(44, +(anchor + 3.4).toFixed(1)),
      Math.min(44, +(anchor + 4.1).toFixed(1)),
      Math.min(44, +(anchor + 1.5).toFixed(1)),
      anchor,
    ];
    return { points, unit: '°C', minBound: 8, maxBound: 45, stroke: '#d97706', fill: 'rgba(245, 158, 11, 0.15)' };
  }, [chartMetric, stats.avgMoisture, stats.avgTemp]);

  const svgCoords = useMemo(() => {
    const w = 320;
    const h = 104;
    const padX = 16;
    const padY = 14;
    const innerW = w - padX * 2;
    const innerH = h - padY * 2;
    const range = Math.max(1, chartData.maxBound - chartData.minBound);

    return chartData.points.map((val, idx) => {
      const x = padX + (idx / (chartData.points.length - 1)) * innerW;
      const y = padY + innerH - ((val - chartData.minBound) / range) * innerH;
      return { x: +x.toFixed(1), y: +y.toFixed(1), val };
    });
  }, [chartData]);

  const linePath = svgCoords
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
  const areaPath =
    svgCoords.length > 0
      ? `${linePath} L ${svgCoords[svgCoords.length - 1].x} 96 L ${svgCoords[0].x} 96 Z`
      : '';

  const ringRadius = 38;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - stats.healthScore / 100);

  const ringStroke =
    stats.healthScore >= 80
      ? '#3d7a47'
      : stats.healthScore >= 55
      ? '#d97706'
      : '#e11d48';

  return (
    <div className="space-y-4 pb-6 tab-panel">
      {/* Hero Luminoso Botánico */}
      <section className="relative overflow-hidden rounded-3xl border border-[#d6e4ce] bg-gradient-to-br from-[#f8fbf5] via-white to-[#ebf3e4] p-5 sm:p-6 shadow-sm">
        {/* Fondo sutil en movimiento */}
        <div
          className="ken-burns pointer-events-none absolute -right-12 -top-12 w-72 h-72 rounded-full opacity-55"
          style={{
            background:
              'radial-gradient(circle, rgba(168, 206, 152, 0.36) 0%, rgba(255,255,255,0) 70%)',
          }}
        />
        <div
          className="sunbeam-anim pointer-events-none absolute -top-24 left-1/3 w-40 h-96 blur-2xl opacity-30"
          style={{
            background: 'linear-gradient(180deg, rgba(253, 230, 138, 0.45), transparent)',
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-[#d5e3cd] text-[11px] font-semibold text-[#47643e] shadow-2xs">
              <span className="relative flex w-2 h-2">
                <span className="beacon-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Monitor Fisiológico en Vivo</span>
            </div>

            <div>
              <h2 className="font-botanical text-2xl sm:text-3xl font-bold text-[#22331d] tracking-tight">
                Panorama del Invernadero
              </h2>
              <p className="text-xs sm:text-sm text-[#576d50] mt-1 leading-relaxed">
                Supervisando{' '}
                <strong className="text-[#273c21]">{stats.total} ejemplares vivos</strong>{' '}
                con inferencia difusa Mamdani y alertas tempranas en tiempo real.
              </p>
            </div>

            {/* Microclima promedio */}
            <div className="flex flex-wrap gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-[#dbe7d3] text-xs font-medium text-[#304729]">
                <Droplets className="w-3.5 h-3.5 text-sky-600" />
                <span>Suelo prom:</span>
                <strong className="text-[#1f321a]">{stats.avgMoisture}%</strong>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-[#dbe7d3] text-xs font-medium text-[#304729]">
                <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                <span>Temp media:</span>
                <strong className="text-[#1f321a]">{stats.avgTemp}°C</strong>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-[#dbe7d3] text-xs font-medium text-[#304729]">
                <Wind className="w-3.5 h-3.5 text-emerald-600" />
                <span>HR media:</span>
                <strong className="text-[#1f321a]">{stats.avgHumidity}%</strong>
              </div>
            </div>
          </div>

          {/* Anillo de Salud Global */}
          <div className="shrink-0 flex items-center gap-4 bg-white/85 backdrop-blur-xs border border-[#d9e7d1] rounded-2xl p-3.5 shadow-2xs self-start md:self-auto">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg viewBox="0 0 96 96" className="w-24 h-24 -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r={ringRadius}
                  fill="none"
                  stroke="#ebf2e6"
                  strokeWidth="8"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={ringRadius}
                  fill="none"
                  stroke={ringStroke}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-botanical text-xl font-bold text-[#22331d]">
                  {stats.healthScore}%
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider text-[#62785a]">
                  Índice
                </span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <p className="font-bold text-[#23351d]">Salud Global</p>
              <p className="text-[#5e7457] max-w-[140px] leading-snug">
                {stats.criticalCount > 0
                  ? `${stats.criticalCount} ejemplar requiere atención prioritaria.`
                  : stats.attentionCount > 0
                  ? `${stats.attentionCount} ejemplar bajo observación preventiva.`
                  : 'Todos tus sectores operan dentro del rango óptimo.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Semáforo de Estados con Barras Animadas */}
      <section
        id="semaforo-general-card"
        className="bg-white/90 rounded-2xl p-4 sm:p-5 border border-[#dce7d5] shadow-2xs space-y-3.5"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#526b4a]" />
            <h3 className="font-bold text-sm text-[#22331d]">Semáforo General</h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToPlantadas('all')}
            className="text-xs font-semibold text-[#4f6d43] hover:text-[#2a4124] inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Plantadas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div id="status-summary-grid" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Estables */}
          <button
            id="metric-estables-btn"
            type="button"
            onClick={() => onNavigateToPlantadas('stable')}
            className="text-left p-3.5 rounded-2xl bg-[#f5faf2] border border-[#dcead4] hover:border-emerald-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Estables
              </span>
              <span className="text-lg font-bold text-[#1f351a] font-botanical">
                {stats.stableCount}
              </span>
            </div>
            <div className="w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden">
              <div
                className="bar-grow h-full bg-emerald-500 rounded-full"
                style={{
                  width: `${stats.total ? Math.round((stats.stableCount / stats.total) * 100) : 0}%`,
                }}
              />
            </div>
            <p className="text-[10.5px] text-emerald-700/80 mt-1.5">
              Riego y vitalidad nominal
            </p>
          </button>

          {/* Atención */}
          <button
            id="metric-atencion-btn"
            type="button"
            onClick={() => onNavigateToPlantadas('attention')}
            className="text-left p-3.5 rounded-2xl bg-[#fffaf0] border border-[#f6e3ba] hover:border-amber-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                En Atención
              </span>
              <span className="text-lg font-bold text-amber-900 font-botanical">
                {stats.attentionCount}
              </span>
            </div>
            <div className="w-full h-1.5 bg-amber-100 rounded-full overflow-hidden">
              <div
                className="bar-grow h-full bg-amber-500 rounded-full"
                style={{
                  width: `${stats.total ? Math.round((stats.attentionCount / stats.total) * 100) : 0}%`,
                }}
              />
            </div>
            <p className="text-[10.5px] text-amber-800/80 mt-1.5">
              Monitoreo preventivo activo
            </p>
          </button>

          {/* Críticas */}
          <button
            id="metric-critico-btn"
            type="button"
            onClick={() => onNavigateToPlantadas('critical')}
            className="text-left p-3.5 rounded-2xl bg-[#fff4f5] border border-[#f7cfd5] hover:border-rose-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Críticas
              </span>
              <span className="text-lg font-bold text-rose-900 font-botanical">
                {stats.criticalCount}
              </span>
            </div>
            <div className="w-full h-1.5 bg-rose-100 rounded-full overflow-hidden">
              <div
                className="bar-grow h-full bg-rose-500 rounded-full"
                style={{
                  width: `${stats.total ? Math.round((stats.criticalCount / stats.total) * 100) : 0}%`,
                }}
              />
            </div>
            <p className="text-[10.5px] text-rose-800/80 mt-1.5">
              Acción inmediata sugerida
            </p>
          </button>
        </div>
      </section>

      {/* Analítica 24h + Mapa Vivo de Sectores */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Curva 24h */}
        <section className="lg:col-span-7 bg-white/90 rounded-2xl p-4 sm:p-5 border border-[#dce7d5] shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-[#22331d]">
                Curva de Tendencia 24h
              </h3>
              <p className="text-[11px] text-[#607659]">
                Oscilación diurna del jardín calibrada al sensor actual
              </p>
            </div>
            <div className="inline-flex p-0.5 rounded-xl bg-[#eef4ea] border border-[#d6e3cd]">
              <button
                type="button"
                onClick={() => setChartMetric('hvs')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  chartMetric === 'hvs'
                    ? 'bg-white text-[#23361e] shadow-2xs'
                    : 'text-[#5a7153]'
                }`}
              >
                Humedad HVS
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('ta')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  chartMetric === 'ta'
                    ? 'bg-white text-[#23361e] shadow-2xs'
                    : 'text-[#5a7153]'
                }`}
              >
                Temperatura TA
              </button>
            </div>
          </div>

          <div className="bg-[#f8fbf6] rounded-xl border border-[#e3ede0] p-3">
            <svg viewBox="0 0 320 118" className="w-full h-32 overflow-visible">
              {/* Líneas guía horizontales */}
              {[24, 52, 80].map((y) => (
                <line
                  key={y}
                  x1="12"
                  y1={y}
                  x2="308"
                  y2={y}
                  stroke="#e4eee0"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
              ))}

              {/* Área rellena */}
              {areaPath && <path d={areaPath} fill={chartData.fill} />}

              {/* Línea trazada */}
              {linePath && (
                <path
                  key={chartMetric}
                  d={linePath}
                  fill="none"
                  stroke={chartData.stroke}
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="svg-draw"
                />
              )}

              {/* Puntos e indicadores horarios */}
              {svgCoords.map((pt, i) => (
                <g key={CHART_HOURS[i]}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={i === svgCoords.length - 1 ? 4.5 : 2.8}
                    fill="#ffffff"
                    stroke={chartData.stroke}
                    strokeWidth="2.2"
                  />
                  <text
                    x={pt.x}
                    y="113"
                    textAnchor="middle"
                    className="fill-[#647a5d] text-[8.5px] font-medium"
                  >
                    {CHART_HOURS[i]}
                  </text>
                </g>
              ))}
            </svg>

            <div className="flex items-center justify-between text-[11px] text-[#4f6747] pt-1 border-t border-[#e5efe0] mt-1">
              <span>
                Promedio actual:{' '}
                <strong>
                  {chartMetric === 'hvs' ? `${stats.avgMoisture}% HVS` : `${stats.avgTemp}°C TA`}
                </strong>
              </span>
              <span className="text-[10.5px] text-[#6d8266]">Sincronizado con {stats.total} plantas</span>
            </div>
          </div>
        </section>

        {/* Mapa Vivo de Sectores */}
        <section className="lg:col-span-5 bg-white/90 rounded-2xl p-4 sm:p-5 border border-[#dce7d5] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#22331d]">Mapa Vivo de Sectores</h3>
              <p className="text-[11px] text-[#607659]">
                Distribución espacial de humedad y estado
              </p>
            </div>
            <MapPin className="w-4 h-4 text-[#526b4a]" />
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5 custom-scrollbar">
            {stats.sectors.map(([sectorName, items]) => {
              const sectorMoisture = Math.round(
                items.reduce((sum, x) => sum + x.soilMoisture, 0) / items.length
              );
              const hasCritical = items.some((x) => x.status === 'critical');
              const hasAttention = items.some((x) => x.status === 'attention');
              const dotClass = hasCritical
                ? 'bg-rose-500'
                : hasAttention
                ? 'bg-amber-500'
                : 'bg-emerald-500';

              return (
                <div
                  key={sectorName}
                  className="p-2.5 rounded-xl bg-[#f7faf5] border border-[#e2ecd9] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                      <span className="text-xs font-bold text-[#273a21] truncate">
                        {sectorName}
                      </span>
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#546d4c] shrink-0">
                      HVS {sectorMoisture}%
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((sp) => (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => onSelectSpecimen(sp)}
                        className="px-2 py-0.5 rounded-md bg-white border border-[#d7e5cf] text-[10.5px] font-medium text-[#354c2e] hover:border-[#6a8f5d] hover:bg-[#eef5ea] transition-colors cursor-pointer"
                      >
                        {sp.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Tarjeta Luminosa Consejero Broti */}
      <section
        id="chatbot-entry-card"
        className="rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-[#f3f8ef] via-white to-[#eaf3e3] border border-[#cfe0c6] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          {/* Mini SVG Broti */}
          <div className="w-14 h-14 rounded-2xl bg-white border border-[#d4e3cb] flex items-center justify-center shrink-0 shadow-2xs">
            <svg viewBox="0 0 64 64" className="w-12 h-12 biobot-idle">
              <line x1="32" y1="18" x2="32" y2="8" stroke="#5a7b4f" strokeWidth="2" strokeLinecap="round" />
              <circle cx="32" cy="7" r="3" fill="#34d399" className="antenna-glow" />
              <path d="M32 24 C24 22 18 16 17 11 C24 12 29 17 32 23 Z" fill="#6d9c5f" />
              <path d="M32 23 C40 21 46 15 47 10 C40 11 35 16 32 22 Z" fill="#82b073" />
              <rect x="17" y="25" width="30" height="6" rx="3" fill="#edf4e8" stroke="#bdd1b4" strokeWidth="1.5" />
              <path d="M19 31 L45 31 L42 52 C41.5 55 39 57 36 57 L28 57 C25 57 22.5 55 22 52 Z" fill="#ffffff" stroke="#bdd1b4" strokeWidth="1.5" />
              <rect x="23" y="34" width="18" height="11" rx="4" fill="#20321b" />
              <circle cx="28" cy="39.5" r="1.7" fill="#4ade80" />
              <circle cx="36" cy="39.5" r="1.7" fill="#4ade80" />
            </svg>
          </div>

          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#4b6a42]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Consejero Broti · SED Mamdani + ChromaDB</span>
            </div>
            <h3 className="font-botanical text-lg font-bold text-[#22331d]">
              ¿Querés diagnosticar un síntoma o calcular riego?
            </h3>
            <p className="text-xs text-[#597053]">
              {stats.activeAlerts[0]
                ? `Sugerencia: Broti detectó alerta abierta en ${stats.activeAlerts[0].name}.`
                : 'Consultá reglas difusas, especies nativas o probá variables en vivo.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenChatbot}
          className="btn-shimmer shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#567a4a] to-[#446638] text-white text-xs font-bold shadow-sm hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Bot className="w-4 h-4" />
          <span>Abrir Chatbot SED</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>

      {/* Alertas Activas con Acción Directa */}
      <section className="bg-white/90 rounded-2xl p-4 sm:p-5 border border-[#dce7d5] shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-[#22331d]">Alertas Activas</h3>
          </div>
          <span
            id="alerts-count-badge"
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              stats.activeAlerts.length > 0
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {stats.activeAlerts.length}{' '}
            {stats.activeAlerts.length === 1 ? 'pendiente' : 'pendientes'}
          </span>
        </div>

        <div id="alerts-list-container" className="space-y-2.5">
          {stats.activeAlerts.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#f4faf1] border border-[#d9ebd1] flex items-center gap-3 text-xs text-[#315129]">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Excelente equilibrio: todas tus plantas operan dentro de parámetros fisiológicos óptimos.
              </span>
            </div>
          ) : (
            stats.activeAlerts.map((sp) => {
              const inferredHydro = sp.irrigationPriority >= sp.phytosanitaryRisk;
              const isHydroPriority = sp.activeAlert
                ? sp.activeAlert.type === 'irrigation'
                : inferredHydro;
              const resolvedAlert: AlertInfo = sp.activeAlert || {
                id: `synth-${sp.id}`,
                specimenId: sp.id,
                specimenName: sp.name,
                type: isHydroPriority ? 'irrigation' : 'phytosanitary',
                label: isHydroPriority ? 'Riego Requerido' : 'Revisión Fitosanitaria',
                reason: `HVS ${sp.soilMoisture}% · TA ${sp.temperature}°C · HR ${sp.humidity}%`,
                irrigationPriority: sp.irrigationPriority,
                phytosanitaryRisk: sp.phytosanitaryRisk,
                severity: sp.status === 'critical' ? 'critical' : 'attention',
                ruleTriggered: isHydroPriority ? 'R-HVS' : 'R-FIT',
              };
              const severityScore = Math.max(
                sp.irrigationPriority,
                sp.phytosanitaryRisk
              );
              const alertTitle = resolvedAlert.label;
              const alertMessage = resolvedAlert.reason;

              return (
                <div
                  key={sp.id}
                  className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    sp.status === 'critical'
                      ? 'bg-[#fff7f7] border-rose-200'
                      : 'bg-[#fffcf4] border-amber-200'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => onSelectSpecimen(sp)}
                      className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[#dce7d5] cursor-pointer"
                    >
                      <img
                        src={sp.imageUrl}
                        alt={sp.name}
                        className="w-full h-full object-cover"
                      />
                    </button>

                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onSelectSpecimen(sp)}
                          className="font-bold text-xs sm:text-sm text-[#22331d] hover:underline cursor-pointer"
                        >
                          {sp.name}
                        </button>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/90 border border-[#dce7d5] text-[#5c7255] font-semibold">
                          {sp.location}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-[#7a3f1d]">
                        {alertTitle}
                      </p>
                      <p className="text-[11px] text-[#5e7158] leading-snug">
                        {alertMessage}
                      </p>

                      {/* Barra de prioridad */}
                      <div className="flex items-center gap-2 pt-0.5 max-w-xs">
                        <div className="flex-1 h-1.5 bg-white/80 rounded-full overflow-hidden border border-[#e6eadf]">
                          <div
                            className={`h-full rounded-full ${
                              severityScore >= 75
                                ? 'bg-rose-500'
                                : severityScore >= 50
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(15, severityScore))}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[#4a5f43]">
                          Prioridad {severityScore}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones Directas 1-clic */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {isHydroPriority && onWaterSpecimen ? (
                      <button
                        type="button"
                        onClick={() => onWaterSpecimen(sp.id)}
                        className="btn-shimmer px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Droplets className="w-3.5 h-3.5" />
                        <span>Regar Ahora</span>
                      </button>
                    ) : (
                      onResolvePhyto && (
                        <button
                          type="button"
                          onClick={() => onResolvePhyto(sp.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Marcar Revisada</span>
                        </button>
                      )
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenAlert(resolvedAlert, sp)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#f2f7ef] text-[#35512d] border border-[#cfdect] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Analizar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Tarjeta de Acceso Rápido a Catálogo y Registro */}
      <section
        id="quick-register-card"
        className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#f8fbf5] to-[#eef5e8] border border-[#d6e4ce] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="space-y-0.5">
          <h3 className="font-bold text-sm text-[#22331d]">
            Expandí tu Herbario Digital
          </h3>
          <p className="text-xs text-[#597053]">
            Consultá las fichas botánicas en ChromaDB o incorporá un nuevo ejemplar al seguimiento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            id="btn-ver-catalogo"
            type="button"
            onClick={onOpenCatalog}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#f1f6ed] text-[#324d2a] border border-[#cfe0c7] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Ver Catálogo</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewSpecimen}
            className="btn-shimmer px-3.5 py-2 rounded-xl bg-[#526b4a] hover:bg-[#42593b] text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Ejemplar</span>
          </button>
        </div>
      </section>
    </div>
  );
};
