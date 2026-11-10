import React, { useState } from 'react';
import { Droplets, Sparkles, Activity } from 'lucide-react';

export type BrotiMood = 'happy' | 'thirsty' | 'thinking' | 'watering';

interface BrotiBotProps {
  mood?: BrotiMood;
  speechText?: string;
  onWater?: () => void;
  specimenName?: string;
}

/**
 * BrotiBot: Compañero interactivo ciber-botánico en maceta inteligente.
 * Reacciona a los estados del SED y las consultas RAG.
 */
export const BrotiBot: React.FC<BrotiBotProps> = ({
  mood = 'happy',
  speechText,
  onWater,
  specimenName = 'Jacarandá'
}) => {
  const [isTickled, setIsTickled] = useState(false);

  // Determinar texto y colores según el estado emocional
  let defaultSpeech = `¡Hola! Soy Broti. Estoy monitoreando tu ${specimenName} con lógica difusa.`;
  let moodLabel = 'Balance Óptimo';
  let moodBadgeClass = 'bg-[#e4f3df] text-[#24591a] border-[#bfe2b8]';
  let eyeColor = '#4ade80';
  let mouthPath = 'M75 126 Q80 130 85 126'; // Sonrisa
  let mouthStroke = '#4ade80';

  if (mood === 'thirsty') {
    defaultSpeech = `¡Cuidado! La prioridad de riego es crítica en tu ${specimenName}. ¡Necesito agua!`;
    moodLabel = 'Déficit Hídrico';
    moodBadgeClass = 'bg-[#fee2e2] text-[#b91c1c] border-[#fca5a5]';
    eyeColor = '#f87171';
    mouthPath = 'M75 129 Q80 124 85 129'; // Preocupada
    mouthStroke = '#f87171';
  } else if (mood === 'thinking') {
    defaultSpeech = 'Consultando manuales botánicos en ChromaDB y evaluando reglas de Mamdani...';
    moodLabel = 'Evaluando SED';
    moodBadgeClass = 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]';
    eyeColor = '#60a5fa';
    mouthPath = 'M76 127 L84 127'; // Concentrada
    mouthStroke = '#60a5fa';
  } else if (mood === 'watering') {
    defaultSpeech = '¡Aah, qué rico! Riego registrado en la bitácora del ejemplar.';
    moodLabel = 'Regando...';
    moodBadgeClass = 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]';
    eyeColor = '#38bdf8';
    mouthPath = 'M74 125 Q80 132 86 125'; // Gran sonrisa
    mouthStroke = '#38bdf8';
  }

  const displayText = isTickled
    ? '¡Me hiciste cosquillas en las hojitas!'
    : speechText || defaultSpeech;

  return (
    <div className="bg-gradient-to-b from-[#fafcf9] to-[#f1f6ee] p-3.5 sm:p-4 rounded-3xl border border-[#d2e2cc] shadow-sm flex flex-col sm:flex-row lg:flex-col items-center justify-between gap-3">
      {/* Barra superior de estado */}
      <div className="w-full flex items-center justify-between text-xs font-mono">
        <span className="text-[#55714d] font-bold flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-600" />
          <span>Broti Companion</span>
        </span>
        <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${moodBadgeClass}`}>
          {moodLabel}
        </span>
      </div>

      {/* Contenedor central responsivo */}
      <div className="flex-1 w-full flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-3">
        {/* Broti SVG Interactivo */}
        <div
          className="relative w-28 h-32 sm:w-32 sm:h-36 flex items-center justify-center biobot-idle cursor-pointer select-none shrink-0"
          onClick={() => {
            setIsTickled(true);
            setTimeout(() => setIsTickled(false), 2000);
          }}
          title="¡Haz clic para interactuar con Broti!"
        >
          {/* Gotitas de agua al regar */}
          {mood === 'watering' && (
            <div className="absolute -top-3 inset-x-0 flex justify-center gap-2.5 pointer-events-none z-20">
              <div className="water-drop w-1.5 h-3 bg-sky-400 rounded-full"></div>
              <div className="water-drop w-1.5 h-3 bg-sky-400 rounded-full" style={{ animationDelay: '0.3s' }}></div>
              <div className="water-drop w-1.5 h-3 bg-sky-400 rounded-full" style={{ animationDelay: '0.6s' }}></div>
            </div>
          )}

          <svg className="w-28 h-32 sm:w-32 sm:h-36 drop-shadow-sm" viewBox="0 0 160 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Antena Bio-sensora */}
            <path d="M80 50 V30" stroke="#78986d" strokeWidth="4" strokeLinecap="round" />
            <circle
              className="antenna-glow"
              cx="80"
              cy="25"
              r="7"
              fill={mood === 'thirsty' ? '#f87171' : mood === 'thinking' ? '#60a5fa' : '#4ade80'}
              stroke={mood === 'thirsty' ? '#ef4444' : mood === 'thinking' ? '#3b82f6' : '#22c55e'}
              strokeWidth="2"
            />
            <circle cx="80" cy="25" r="3" fill="#ffffff" />

            {/* Hojas de la plantita */}
            <g className="biobot-leaves">
              <path d="M80 52 C50 45 42 20 60 12 C75 5 80 35 80 52 Z" fill="url(#brotiLeafGrad)" stroke="#3f6133" strokeWidth="2" />
              <path d="M80 52 C110 45 118 20 100 12 C85 5 80 35 80 52 Z" fill="url(#brotiLeafGrad)" stroke="#3f6133" strokeWidth="2" />
              <circle cx="80" cy="45" r="8" fill="#a78bfa" stroke="#7c3aed" strokeWidth="1.5" />
              <circle cx="80" cy="45" r="3.5" fill="#fbbf24" />
            </g>

            {/* Tallo */}
            <rect x="76" y="52" width="8" height="22" rx="4" fill="#608454" stroke="#3b5930" strokeWidth="1.5" />

            {/* Maceta Inteligente blanca */}
            <path d="M35 74 Q80 70 125 74 L115 150 Q80 156 45 150 Z" fill="#ffffff" stroke="#c8dec4" strokeWidth="3" />
            <path d="M38 88 Q80 85 122 88 L120 98 Q80 95 40 98 Z" fill="#ebf5e9" />

            {/* Pantalla Visor Digital */}
            <rect x="48" y="102" width="64" height="34" rx="10" fill="#1b2a19" stroke="#739a68" strokeWidth="1.5" />

            {/* Ojitos Digitales */}
            <g className="biobot-eyes">
              <ellipse cx="66" cy="118" rx="5" ry="6" fill={eyeColor} />
              <circle cx="68" cy="116" r="1.5" fill="#ffffff" />
              <ellipse cx="94" cy="118" rx="5" ry="6" fill={eyeColor} />
              <circle cx="96" cy="116" r="1.5" fill="#ffffff" />
              <path d={mouthPath} stroke={mouthStroke} strokeWidth="2" strokeLinecap="round" fill="none" />
            </g>

            {/* Patitas */}
            <rect x="48" y="150" width="12" height="10" rx="3" fill="#88aa7f" />
            <rect x="100" y="150" width="12" height="10" rx="3" fill="#88aa7f" />

            {/* Gradiente de hojas */}
            <defs>
              <linearGradient id="brotiLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#86efac" />
                <stop offset="100%" stopColor="#3b7a2d" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Globo de Diálogo de Broti y Botón de Riego */}
        <div className="flex-1 w-full space-y-2">
          <div className="relative w-full">
            <div className="speech-enter bg-white p-3 rounded-2xl border border-[#d0e0cb] shadow-xs text-xs text-[#20361a] text-center sm:text-left lg:text-center font-medium leading-snug">
              {displayText}
            </div>
            <div className="w-3 h-3 bg-white border-r border-b border-[#d0e0cb] transform rotate-45 mx-auto sm:ml-6 lg:mx-auto -mt-1.5"></div>
          </div>

          {/* Botón de acción rápida: ¡Dar Agua! */}
          {onWater && (
            <button
              onClick={onWater}
              className="w-full bg-gradient-to-r from-sky-500 to-emerald-600 hover:from-sky-600 hover:to-emerald-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>¡Dar Riego a {specimenName}!</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
