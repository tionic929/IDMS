import React from 'react';

export const RulerHorizontal = ({ zoom }: { zoom: number }) => (
  <div className="h-6 w-full bg-zinc-900 border-b border-zinc-800 relative overflow-hidden flex text-[9px] text-zinc-500 font-mono select-none">
    {Array.from({ length: 40 }).map((_, i) => (
      <div key={i} className="absolute bottom-0 border-l border-zinc-700 h-2" style={{ left: i * 50 * zoom }}>
        {i > 0 && <span className="absolute -top-4 -left-2">{i * 50}</span>}
      </div>
    ))}
  </div>
);

export const RulerVertical = ({ zoom }: { zoom: number }) => (
  <div className="w-6 h-full bg-zinc-900 border-r border-zinc-800 relative overflow-hidden flex flex-col text-[9px] text-zinc-500 font-mono select-none">
    {Array.from({ length: 60 }).map((_, i) => (
      <div key={i} className="absolute right-0 border-t border-zinc-700 w-2" style={{ top: i * 50 * zoom }}>
        {i > 0 && <span className="absolute -left-5 -top-2 w-4 text-right">{i * 50}</span>}
      </div>
    ))}
  </div>
);