import React from 'react';

export const OverrideField = ({ label, value, onChange }: {
    label: string; value: string; onChange: (v: string) => void;
}) => (
    <div className="space-y-1">
        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-wider block">{label}</span>
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-foreground outline-none focus:border-primary transition-colors" />
    </div>
);
