import React from 'react';

/**
 * BackgroundFoliage: Capa decorativa de fondo con hojas botánicas flotantes animadas
 * y siluetas sutiles en las esquinas, manteniendo la paleta clara y luminosa.
 */
export const BackgroundFoliage: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Resplandores ambientales botánicos muy sutiles y limpios */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#e4f0df] rounded-full filter blur-3xl opacity-25"></div>
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-[#edf6eb] rounded-full filter blur-3xl opacity-30"></div>
      <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-[#e0eee0] rounded-full filter blur-3xl opacity-20"></div>

      {/* Hoja 1: Monstera (Costilla de Adán) */}
      <svg
        className="leaf-float-1 absolute left-[8%] -top-12 w-14 h-14 text-[#608254]"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M17 8C8 10 5 16 5 21c5-2 11-4 13-11 1-3 0-4-1-2zm-5 5c-2 1-3 3-3 4 2-1 4-2 5-3-1-.5-1.5-.7-2-1z" />
      </svg>

      {/* Hoja 2: Helecho / Palma */}
      <svg
        className="leaf-float-2 absolute left-[38%] -top-12 w-12 h-12 text-[#729665]"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M21 3c-8.28 0-15 6.72-15 15v3c0 .55.45 1 1 1h3c8.28 0 15-6.72 15-15V4c0-.55-.45-1-1-1zm-2 4c-3.87 0-7 3.13-7 7 0-3.87-3.13-7-7-7 0 5.52 4.48 10 10 10s10-4.48 10-10H19z" />
      </svg>

      {/* Hoja 3: Hoja lanceolada orgánica */}
      <svg
        className="leaf-float-3 absolute left-[68%] -top-12 w-11 h-11 text-[#5b7d4e]"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M17 8C8 10 5 16 5 21c5-2 11-4 13-11 1-3 0-4-1-2z" />
      </svg>

      {/* Hoja 4: Trébol / Silueta */}
      <svg
        className="leaf-float-4 absolute left-[88%] -top-12 w-14 h-14 text-[#527346]"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2C6.5 2 2 6.5 2 12c0 2.2.7 4.2 2 5.8L3 21l3.5-.9c1.6 1.1 3.5 1.9 5.5 1.9 5.5 0 10-4.5 10-10S17.5 2 12 2zm1 13c-2 1-4 0-5-2 1-1 2-2 4-2 .5 1.5 1 3 1 4z" />
      </svg>

      {/* Hoja 5: Sauce */}
      <svg
        className="leaf-float-5 absolute left-[22%] -top-12 w-10 h-10 text-[#6a8c5f]"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M17 8C8 10 5 16 5 21c5-2 11-4 13-11 1-3 0-4-1-2z" />
      </svg>

      {/* Siluetas de esquinas fijas con suave balanceo */}
      <div className="sway-slow absolute -bottom-10 -left-10 w-64 h-64 text-[#46693a] opacity-[0.09] pointer-events-none">
        <svg viewBox="0 0 200 200" fill="currentColor">
          <path d="M40 180 C20 120, 30 60, 90 20 C80 60, 90 100, 140 130 C100 130, 70 150, 40 180 Z" />
        </svg>
      </div>
      <div
        className="sway-slow absolute -top-10 -right-10 w-72 h-72 text-[#3b5930] opacity-[0.08] pointer-events-none"
        style={{ animationDelay: '-4s' }}
      >
        <svg viewBox="0 0 200 200" fill="currentColor">
          <path d="M160 20 C180 80, 170 140, 110 180 C120 140, 110 100, 60 70 C100 70, 130 50, 160 20 Z" />
        </svg>
      </div>
    </div>
  );
};
