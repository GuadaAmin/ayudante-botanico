import React from 'react';

interface BackgroundFoliageProps {
  showPollen?: boolean;
  zenPaused?: boolean;
}

const POLLEN_MOTES = [
  { id: 'p1', left: '7%',  size: 5,  cls: 'pollen-a', delay: '-4s',  dur: '19s', color: 'rgba(217, 178, 76, 0.55)', glow: 'rgba(234, 179, 8, 0.35)' },
  { id: 'p2', left: '16%', size: 8,  cls: 'pollen-b', delay: '-11s', dur: '25s', color: 'rgba(138, 176, 120, 0.48)', glow: 'rgba(104, 148, 86, 0.25)' },
  { id: 'p3', left: '28%', size: 4,  cls: 'pollen-a', delay: '-15s', dur: '17s', color: 'rgba(232, 200, 110, 0.62)', glow: 'rgba(234, 179, 8, 0.38)' },
  { id: 'p4', left: '41%', size: 7,  cls: 'pollen-b', delay: '-7s',  dur: '22s', color: 'rgba(176, 209, 159, 0.52)', glow: 'rgba(138, 176, 120, 0.28)' },
  { id: 'p5', left: '54%', size: 5,  cls: 'pollen-a', delay: '-2s',  dur: '20s', color: 'rgba(227, 189, 88, 0.54)', glow: 'rgba(234, 179, 8, 0.32)' },
  { id: 'p6', left: '68%', size: 9,  cls: 'pollen-b', delay: '-18s', dur: '26s', color: 'rgba(138, 176, 120, 0.42)', glow: 'rgba(104, 148, 86, 0.24)' },
  { id: 'p7', left: '81%', size: 6,  cls: 'pollen-a', delay: '-9s',  dur: '18s', color: 'rgba(238, 207, 118, 0.58)', glow: 'rgba(234, 179, 8, 0.36)' },
  { id: 'p8', left: '92%', size: 5,  cls: 'pollen-b', delay: '-13s', dur: '23s', color: 'rgba(162, 198, 145, 0.48)', glow: 'rgba(104, 148, 86, 0.24)' },
];

export const BackgroundFoliage: React.FC<BackgroundFoliageProps> = ({
  showPollen = true,
  zenPaused = false,
}) => {
  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden z-0 ${zenPaused ? 'zen-paused' : ''}`}
      aria-hidden="true"
    >
      {/* Luminosidad matinal botánica */}
      <div
        className="absolute -top-36 -left-32 w-[540px] h-[540px] rounded-full blur-3xl opacity-45"
        style={{ background: 'radial-gradient(circle, rgba(203, 224, 188, 0.72) 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/3 -right-28 w-[460px] h-[460px] rounded-full blur-3xl opacity-35"
        style={{ background: 'radial-gradient(circle, rgba(248, 232, 184, 0.55) 0%, transparent 72%)' }}
      />
      <div
        className="absolute -bottom-36 left-1/4 w-[520px] h-[520px] rounded-full blur-3xl opacity-35"
        style={{ background: 'radial-gradient(circle, rgba(186, 214, 172, 0.52) 0%, transparent 70%)' }}
      />

      {/* Haz diagonal suave de sol de invernadero */}
      <div
        className="sunbeam-anim absolute -top-44 left-[18%] w-[320px] h-[140vh] blur-2xl"
        style={{
          background:
            'linear-gradient(180deg, rgba(255, 250, 224, 0.42) 0%, rgba(255, 250, 224, 0.12) 55%, transparent 100%)',
        }}
      />

      {/* Hojas botánicas flotando */}
      <svg
        className="leaf-float-1 absolute top-[8%] left-[5%] w-12 h-12 text-[#80a173]/30"
        viewBox="0 0 64 64"
        fill="currentColor"
      >
        <path d="M52 12C30 12 14 26 12 50c24-2 38-18 40-38zm-6 6c-2 12-10 21-22 25 4-12 12-20 22-25z" />
      </svg>

      <svg
        className="leaf-float-2 absolute top-[22%] right-[8%] w-14 h-14 text-[#6d8f5f]/25"
        viewBox="0 0 64 64"
        fill="currentColor"
      >
        <path d="M32 6C20 18 16 32 22 48c14-4 26-16 26-30 0-5-2-9-4-12-4 0-8 0-12 0z" opacity="0.85" />
      </svg>

      <svg
        className="leaf-float-3 absolute bottom-[18%] left-[12%] w-11 h-11 text-[#92b185]/30"
        viewBox="0 0 64 64"
        fill="currentColor"
      >
        <path d="M50 14C34 14 20 24 14 44c18-2 32-12 36-30z" />
      </svg>

      <svg
        className="leaf-float-4 absolute top-[56%] right-[14%] w-10 h-10 text-[#86a777]/25"
        viewBox="0 0 64 64"
        fill="currentColor"
      >
        <path d="M16 48C18 28 30 16 50 14c-2 20-14 32-34 34z" />
      </svg>

      <svg
        className="leaf-float-5 absolute bottom-[10%] right-[24%] w-12 h-12 text-[#729464]/20"
        viewBox="0 0 64 64"
        fill="currentColor"
      >
        <path d="M48 16C30 16 18 28 16 46c18-2 30-14 32-30z" />
      </svg>

      {/* Destellos de polen flotantes */}
      {showPollen &&
        POLLEN_MOTES.map((mote) => (
          <span
            key={mote.id}
            className={`${mote.cls} absolute top-0 rounded-full`}
            style={{
              left: mote.left,
              width: `${mote.size}px`,
              height: `${mote.size}px`,
              backgroundColor: mote.color,
              boxShadow: `0 0 ${mote.size * 2.2}px ${mote.glow}`,
              animationDuration: mote.dur,
              animationDelay: mote.delay,
            }}
          />
        ))}

      {/* Siluetas botánicas laterales mecidas suavemente */}
      <svg
        className="sway-slow absolute -bottom-6 -left-6 w-52 h-52 text-[#78966a]/15"
        viewBox="0 0 200 200"
        fill="currentColor"
      >
        <path d="M20 200 C30 140 65 95 110 70 C85 115 65 155 55 200 Z" />
        <path d="M0 200 C5 150 25 120 65 105 C45 140 30 170 25 200 Z" opacity="0.7" />
        <path d="M45 200 C65 155 105 130 155 125 C120 155 95 178 85 200 Z" opacity="0.6" />
      </svg>

      <svg
        className="sway-slow absolute -bottom-4 -right-6 w-56 h-56 text-[#68875b]/15"
        style={{ animationDelay: '-3s' }}
        viewBox="0 0 200 200"
        fill="currentColor"
      >
        <path d="M180 200 C170 135 135 90 88 68 C115 112 135 155 145 200 Z" />
        <path d="M200 200 C192 150 170 120 128 108 C150 140 165 170 170 200 Z" opacity="0.75" />
      </svg>
    </div>
  );
};
