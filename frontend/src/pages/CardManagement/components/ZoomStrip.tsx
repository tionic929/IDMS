import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export const ZoomStrip = ({ scale, onIn, onOut, onReset }: {
    scale: number; onIn: () => void; onOut: () => void; onReset: () => void;
}) => (
    <div className="flex items-center bg-muted/50 border border-border rounded-lg overflow-hidden divide-x divide-border">
        <button onClick={onOut} className="p-1.5 hover:bg-muted text-muted-foreground transition-colors"><ZoomOut size={12} /></button>
        <span className="px-2.5 text-[9px] font-black text-muted-foreground tabular-nums select-none min-w-[40px] text-center">{Math.round(scale * 100)}%</span>
        <button onClick={onIn} className="p-1.5 hover:bg-muted text-muted-foreground transition-colors"><ZoomIn size={12} /></button>
        <button onClick={onReset} className="p-1.5 hover:bg-muted text-muted-foreground transition-colors"><RotateCcw size={11} /></button>
    </div>
);
