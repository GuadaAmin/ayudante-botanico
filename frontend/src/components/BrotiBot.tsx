import React, { useEffect, useState } from 'react';
import {
  Droplets,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldAlert,
  Cpu,
  Heart,
  Sun,
} from 'lucide-react';

export type BrotiMood = 'happy' | 'thirsty' | 'thinking' | 'watering' | 'phyto' | 'tickled';

interface BrotiBotProps {
  mood?: BrotiMood;
  speechText?: string;
  onWater?: () => void;
  specimenName?: string;
  soilMoisture?: number;
}

interface StateMeta {
  id: BrotiMood;
  label: string;
  badgeText: string;
  badgeClass: string;
  ledColor: string;
  ringColor: string;
  auraColor: string;
  triggerGuide: string;
  defaultSpeech: (plant: string) => string;
}

const BROTI_STATES: Record<BrotiMood, StateMeta> = {
  happy: {
    id: 'happy',
    label: 'Óptimo',
    badgeText: 'Homeostasis 94%',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ledColor: '#34d399',
    ringColor: '#4e8a45',
    auraColor: 'rgba(116, 179, 102, 0.24)',
    triggerGuide:
      'Se activa automáticamente cuando el ejemplar seleccionado tiene prioridad de riego <= 65% y sin riesgo fitosanitario activo.',
    defaultSpeech: (plant) =>
      `${plant} respira en equilibrio hídrico. Parámetros HVS, TA y HR dentro del rango saludable.`,
  },
  thirsty: {
    id: 'thirsty',
    label: 'Con Sed',
    badgeText: 'Déficit Hídrico',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    ledColor: '#f59e0b',
    ringColor: '#d97706',
    auraColor: 'rgba(245, 158, 11, 0.20)',
    triggerGuide:
      'Se activa cuando el motor Mamdani calcula prioridad de riego > 65% o al elegir un ejemplar con déficit hídrico en Plantadas.',
    defaultSpeech: (plant) =>
      `Detecté suelo seco en ${plant}. Las reglas difusas sugieren iniciar un pulso de riego pronto.`,
  },
  thinking: {
    id: 'thinking',
    label: 'Pensando',
    badgeText: 'Inferencia Mamdani + RAG',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    ledColor: '#a78bfa',
    ringColor: '#7c3aed',
    auraColor: 'rgba(139, 92, 246, 0.22)',
    triggerGuide:
      'Se activa mientras envías una consulta al chat y Broti cruza las 20 reglas difusas con el herbario ChromaDB.',
    defaultSpeech: (plant) =>
      `Evaluando reglas Mamdani y cruzando taxonomía vectorial de ${plant}...`,
  },
  watering: {
    id: 'watering',
    label: 'Regando',
    badgeText: 'Pulso Activo',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    ledColor: '#38bdf8',
    ringColor: '#0284c7',
    auraColor: 'rgba(56, 189, 248, 0.24)',
    triggerGuide:
      'Se activa al presionar "Enviar pulso de riego" aquí o "Regar Ahora" desde Plantadas o el Dashboard.',
    defaultSpeech: (plant) =>
      `Aplicando riego de precisión sobre ${plant}. La conductividad térmica foliar se estabiliza.`,
  },
  phyto: {
    id: 'phyto',
    label: 'Fitosanitario',
    badgeText: 'Vigilancia Plagas',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    ledColor: '#fb7185',
    ringColor: '#e11d48',
    auraColor: 'rgba(244, 63, 94, 0.20)',
    triggerGuide:
      'Se activa cuando el ejemplar presenta riesgo fitosanitario moderado/alto o una alerta de hongo/plaga abierta.',
    defaultSpeech: (plant) =>
      `Atención en ${plant}: detecté microclima propicio para estrés biótico. Revisá el diagnóstico RAG.`,
  },
  tickled: {
    id: 'tickled',
    label: 'Cosquillas',
    badgeText: 'Vínculo Activo',
    badgeClass: 'bg-pink-50 text-pink-700 border-pink-200',
    ledColor: '#f472b6',
    ringColor: '#db2777',
    auraColor: 'rgba(244, 114, 182, 0.25)',
    triggerGuide:
      'Easter egg táctil: hacé clic directo sobre la maceta o visor de Broti en cualquier momento para saludarlo.',
    defaultSpeech: (plant) =>
      `¡Gracias por el cariño! ${plant} y todo el invernadero agradecen tu cuidado constante.`,
  },
};

const STATE_ORDER: BrotiMood[] = ['happy', 'thirsty', 'thinking', 'watering', 'phyto', 'tickled'];

export const BrotiBot: React.FC<BrotiBotProps> = ({
  mood = 'happy',
  speechText,
  onWater,
  specimenName = 'Jacarandá',
  soilMoisture = 62,
}) => {
  const [previewMood, setPreviewMood] = useState<BrotiMood | null>(null);
  const [showTrainer, setShowTrainer] = useState<boolean>(false);

  useEffect(() => {
    setPreviewMood(null);
  }, [mood, specimenName]);

  const activeMood: BrotiMood = previewMood ?? mood;
  const meta = BROTI_STATES[activeMood];

  const handleTickle = () => {
    setPreviewMood('tickled');
  };

  const normalizedMoisture = Math.max(0, Math.min(100, Math.round(soilMoisture)));
  const ringRadius = 74;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const displayFillPct = activeMood === 'watering' ? Math.min(100, normalizedMoisture + 18) : normalizedMoisture;
  const strokeDashoffset = ringCircumference * (1 - displayFillPct / 100);

  const speech =
    previewMood !== null
      ? meta.defaultSpeech(specimenName)
      : speechText || meta.defaultSpeech(specimenName);

  const isDrooping = activeMood === 'thirsty' || activeMood === 'phyto';
  const isExcited = activeMood === 'tickled' || activeMood === 'watering';
  const showBlush = activeMood === 'happy' || activeMood === 'tickled' || activeMood === 'watering';

  return (
    <div className="bg-white/90 backdrop-blur-xs border border-[#dce7d5] rounded-2xl p-4 shadow-sm flex flex-col gap-3">
      {/* Encabezado de Estado Vivo */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 transition-colors"
            style={{ backgroundColor: meta.ledColor }}
          />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#55704c] truncate">
              Broti · {specimenName}
            </p>
            <p className="text-[11px] text-[#708568] truncate">
              Humedad sustrato: <strong className="text-[#2b4024]">{normalizedMoisture}%</strong>
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${meta.badgeClass}`}
        >
          {meta.badgeText}
        </span>
      </div>

      {/* Escenario SVG de Broti con Anillo Hidratación */}
      <div className="relative flex flex-col items-center justify-center py-2">
        <button
          type="button"
          onClick={handleTickle}
          title="Hacé clic en Broti para activar el estado Cosquillas"
          className="relative w-44 h-44 flex items-center justify-center rounded-full cursor-pointer focus:outline-none group"
        >
          {/* Aura respiratoria */}
          <div
            className="aura-breath absolute inset-3 rounded-full blur-xl transition-colors duration-500"
            style={{ backgroundColor: meta.auraColor }}
          />

          {/* Anillo orbital extra cuando piensa */}
          {activeMood === 'thinking' && (
            <div className="absolute inset-1 rounded-full border-2 border-dashed border-violet-300/80 animate-spin" style={{ animationDuration: '9s' }} />
          )}

          <svg viewBox="0 0 180 180" className="w-44 h-44 relative z-10 overflow-visible">
            {/* Pista y arco del sensor de humedad */}
            <circle
              cx="90"
              cy="90"
              r={ringRadius}
              fill="none"
              stroke="#eaf1e5"
              strokeWidth="4.5"
            />
            <circle
              cx="90"
              cy="90"
              r={ringRadius}
              fill="none"
              stroke={meta.ringColor}
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeDasharray={ringCircumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 90 90)"
              style={{ transition: 'stroke-dashoffset 0.7s ease, stroke 0.4s ease' }}
            />

            {/* Destellos ascendiendo cuando tiene cosquillas */}
            {activeMood === 'tickled' && (
              <g>
                <path
                  d="M38 64 l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 Z"
                  fill="#f472b6"
                  className="spark-up"
                />
                <path
                  d="M140 56 l2.5 -6 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5 -6 l-6 -2.5 Z"
                  fill="#fbbf24"
                  className="spark-up"
                  style={{ animationDelay: '0.45s' }}
                />
                <circle cx="52" cy="42" r="3" fill="#34d399" className="spark-up" style={{ animationDelay: '0.25s' }} />
              </g>
            )}

            {/* Gotas cayendo en estado Regando */}
            {activeMood === 'watering' && (
              <g>
                <path d="M52 28 C52 28 47 36 47 40 a5 5 0 0 0 10 0 C57 36 52 28 52 28 Z" fill="#38bdf8" className="water-drop" />
                <path d="M90 18 C90 18 85 26 85 30 a5 5 0 0 0 10 0 C95 26 90 18 90 18 Z" fill="#0ea5e9" className="water-drop" style={{ animationDelay: '0.35s' }} />
                <path d="M128 30 C128 30 123 38 123 42 a5 5 0 0 0 10 0 C133 38 128 30 128 30 Z" fill="#38bdf8" className="water-drop" style={{ animationDelay: '0.7s' }} />
              </g>
            )}

            {/* Alerta escudo en modo Fitosanitario */}
            {activeMood === 'phyto' && (
              <g className="antenna-glow">
                <circle cx="136" cy="52" r="10" fill="#ffe4e6" stroke="#f43f5e" strokeWidth="1.8" />
                <path d="M136 47 v6 M136 56 v1.5" stroke="#e11d48" strokeWidth="2.2" strokeLinecap="round" />
              </g>
            )}

            {/* Cuerpo completo de Broti */}
            <g className={isExcited ? 'biobot-excited' : 'biobot-idle'}>
              {/* Antena sensorial trasera */}
              <line x1="90" y1="68" x2="90" y2="34" stroke="#5d7e52" strokeWidth="2.6" strokeLinecap="round" />
              <circle
                cx="90"
                cy="31"
                r="5.5"
                fill={meta.ledColor}
                className="antenna-glow"
                stroke="#ffffff"
                strokeWidth="1.5"
              />

              {/* Hojas y corona floral sobre la tierra */}
              <g className={isDrooping ? 'biobot-leaves-droop' : 'biobot-leaves'}>
                {/* Tallo central */}
                <path d="M90 88 C90 74 88 64 90 54" stroke="#4f7443" strokeWidth="3.2" fill="none" strokeLinecap="round" />
                {/* Hoja izquierda */}
                <path
                  d="M89 75 C72 72 58 61 54 48 C68 48 82 58 89 72 Z"
                  fill={activeMood === 'thirsty' ? '#95a571' : '#659656'}
                />
                {/* Hoja derecha */}
                <path
                  d="M91 72 C108 69 122 57 127 44 C112 45 98 55 91 69 Z"
                  fill={activeMood === 'phyto' ? '#b89f68' : '#79ab68'}
                />
                {/* Flor reactiva */}
                {(activeMood === 'happy' || activeMood === 'watering' || activeMood === 'tickled') && (
                  <g className="flower-bloom" transform="translate(90, 48)">
                    <circle cx="0" cy="-6" r="4" fill="#fef08a" />
                    <circle cx="6" cy="-2" r="4" fill="#fde047" />
                    <circle cx="4" cy="5" r="4" fill="#fef08a" />
                    <circle cx="-4" cy="5" r="4" fill="#fde047" />
                    <circle cx="-6" cy="-2" r="4" fill="#fef08a" />
                    <circle cx="0" cy="0" r="3.2" fill="#f59e0b" />
                  </g>
                )}
              </g>

              {/* Sustrato / Tierra */}
              <ellipse cx="90" cy="87" rx="34" ry="7" fill="#5c4738" />

              {/* Labio superior de la maceta cerámica */}
              <rect x="49" y="85" width="82" height="14" rx="7" fill="#f3f7ef" stroke="#cadac2" strokeWidth="2" />

              {/* Cuerpo trapezoidal de la maceta */}
              <path
                d="M55 99 L125 99 L117 148 C116 154 111 158 105 158 L75 158 C69 158 64 154 63 148 Z"
                fill="#ffffff"
                stroke="#cadac2"
                strokeWidth="2.2"
              />

              {/* Sombra suave inferior */}
              <path
                d="M62 142 L118 142 L116 149 C115 154 110 157 104 157 L76 157 C70 157 65 154 64 149 Z"
                fill="#ebf2e5"
              />

              {/* Visor Digital LED */}
              <rect x="64" y="106" width="52" height="29" rx="9" fill="#1e2f19" />
              <rect x="66" y="108" width="48" height="25" rx="7" fill="#23371d" />

              {/* Expresiones faciales según estado */}
              {activeMood === 'tickled' || activeMood === 'watering' ? (
                <g>
                  <path d="M74 120 Q79 113 84 120" stroke="#4ade80" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <path d="M96 120 Q101 113 106 120" stroke="#4ade80" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <path d="M84 126 Q90 131 96 126" stroke="#86efac" strokeWidth="2" fill="none" strokeLinecap="round" />
                </g>
              ) : activeMood === 'thirsty' ? (
                <g>
                  <line x1="74" y1="115" x2="84" y2="118" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="106" y1="115" x2="96" y2="118" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
                  <circle cx="79" cy="121" r="2.6" fill="#fbbf24" />
                  <circle cx="101" cy="121" r="2.6" fill="#fbbf24" />
                  <path d="M84 128 Q90 124 96 128" stroke="#fcd34d" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <path d="M111 112 C111 112 108.5 116 108.5 118 a2.5 2.5 0 0 0 5 0 C113.5 116 111 112 111 112 Z" fill="#38bdf8" />
                </g>
              ) : activeMood === 'phyto' ? (
                <g>
                  <circle cx="79" cy="119" r="3" fill="#fda4af" />
                  <circle cx="101" cy="119" r="3" fill="#fda4af" />
                  <line x1="83" y1="127" x2="97" y2="127" stroke="#fda4af" strokeWidth="2.2" strokeLinecap="round" />
                </g>
              ) : activeMood === 'thinking' ? (
                <g>
                  <circle cx="80" cy="117" r="2.8" fill="#c4b5fd" />
                  <circle cx="102" cy="117" r="2.8" fill="#c4b5fd" />
                  <circle cx="84" cy="127" r="1.4" fill="#ddd6fe" />
                  <circle cx="90" cy="127" r="1.4" fill="#ddd6fe" />
                  <circle cx="96" cy="127" r="1.4" fill="#ddd6fe" />
                </g>
              ) : (
                <g className="biobot-eyes">
                  <circle cx="79" cy="119" r="3.1" fill="#4ade80" />
                  <circle cx="101" cy="119" r="3.1" fill="#4ade80" />
                  <path d="M84 126 Q90 130 96 126" stroke="#86efac" strokeWidth="2" fill="none" strokeLinecap="round" />
                </g>
              )}

              {/* Mejillas digitales rosadas */}
              {showBlush && (
                <g opacity={activeMood === 'tickled' ? 0.9 : 0.45}>
                  <ellipse cx="72" cy="124" rx="3.4" ry="1.8" fill="#f472b6" />
                  <ellipse cx="108" cy="124" rx="3.4" ry="1.8" fill="#f472b6" />
                </g>
              )}

              {/* LED inferior de estado */}
              <circle cx="90" cy="147" r="3.5" fill={meta.ledColor} />
            </g>
          </svg>
        </button>

        {/* Barras de voz animadas cuando Broti está pensando */}
        {activeMood === 'thinking' && (
          <div className="flex items-end gap-1 h-4 mt-0.5" aria-label="Broti analizando reglas">
            <span className="wave-bar w-1 h-3 rounded-full bg-violet-400" />
            <span className="wave-bar w-1 h-4 rounded-full bg-violet-500" style={{ animationDelay: '0.15s' }} />
            <span className="wave-bar w-1 h-2.5 rounded-full bg-violet-400" style={{ animationDelay: '0.3s' }} />
            <span className="wave-bar w-1 h-3.5 rounded-full bg-violet-500" style={{ animationDelay: '0.45s' }} />
          </div>
        )}
      </div>

      {/* Globo de Diálogo */}
      <div className="speech-enter bg-[#f6f9f4] border border-[#dce7d5] rounded-xl p-3 text-xs text-[#2d4027] leading-relaxed shadow-2xs">
        <p>{speech}</p>
        <p className="text-[10px] text-[#758a6d] mt-1.5">
          Tip: tocá a Broti para hacerle cosquillas o elegí un estado abajo para probarlo.
        </p>
      </div>

      {/* Botón de Riego Rápido con Shimmer */}
      {onWater && (
        <button
          type="button"
          onClick={onWater}
          className="btn-shimmer w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#587c4b] to-[#46683a] text-white text-xs font-semibold shadow-sm hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Droplets className="w-4 h-4" />
          <span>Enviar pulso de riego a {specimenName}</span>
        </button>
      )}

      {/* Panel Interactivo: Probá los 6 Estados de Broti */}
      <div className="border-t border-[#e7efe2] pt-2.5">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowTrainer((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#48653f] hover:text-[#2a4124] cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#5b7f4e]" />
            <span>Probá los 6 estados de Broti</span>
            {showTrainer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {previewMood !== null && (
            <button
              type="button"
              onClick={() => setPreviewMood(null)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#edf4e8] text-[#45613c] text-[10px] font-semibold hover:bg-[#dfecd6] cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Sincronizar</span>
            </button>
          )}
        </div>

        {showTrainer && (
          <div className="mt-2.5 space-y-2.5">
            <div className="grid grid-cols-3 gap-1.5">
              {STATE_ORDER.map((id) => {
                const st = BROTI_STATES[id];
                const isSelected = activeMood === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPreviewMood(id)}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-[#4f6d43] text-white border-[#4f6d43] shadow-2xs'
                        : 'bg-white text-[#4f6747] border-[#dce7d5] hover:bg-[#f4f8f1]'
                    }`}
                  >
                    {id === 'happy' && <Sun className="w-3 h-3" />}
                    {id === 'thirsty' && <Droplets className="w-3 h-3" />}
                    {id === 'thinking' && <Cpu className="w-3 h-3" />}
                    {id === 'watering' && <Droplets className="w-3 h-3" />}
                    {id === 'phyto' && <ShieldAlert className="w-3 h-3" />}
                    {id === 'tickled' && <Heart className="w-3 h-3" />}
                    <span className="truncate">{st.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-2.5 rounded-xl bg-[#f7faf5] border border-[#e2ecd9] text-[11px] text-[#485d41] leading-relaxed">
              <p className="font-bold text-[#2b4024] mb-0.5">
                Cómo verlo en uso real ({meta.label}):
              </p>
              <p>{meta.triggerGuide}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
