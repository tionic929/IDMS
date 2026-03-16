
﻿import React from 'react';

export const RulerHorizontal = ({ zoom }: { zoom: number }) => (
  <div className="h-6 w-full bg-card border-b border-border relative overflow-hidden flex text-[9px] text-muted-foreground font-black tracking-tighter select-none">
    {Array.from({ length: 40 }).map((_, i) => (
      <div key={i} className="absolute bottom-0 border-l border-border/50 h-2" style={{ left: i * 50 * zoom }}>
        {i > 0 && <span className="absolute -top-4 -left-3 w-8 text-center">{i * 50}</span>}

      </div>
    ))}
  </div>
);

export const RulerVertical = ({ zoom }: { zoom: number }) => (

  <div className="w-6 h-full bg-card border-r border-border relative overflow-hidden flex flex-col text-[9px] text-muted-foreground font-black tracking-tighter select-none">
    {Array.from({ length: 60 }).map((_, i) => (
      <div key={i} className="absolute right-0 border-t border-border/50 w-2" style={{ top: i * 50 * zoom }}>
        {i > 0 && <span className="absolute -left-3 -top-2 w-4 text-center transform -rotate-90">{i * 50}</span>}
      </div>
    ))}
  </div>
);


