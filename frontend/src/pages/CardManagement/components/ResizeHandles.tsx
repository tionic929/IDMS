import React from 'react';
import { Separator as PanelResizeHandle } from 'react-resizable-panels';

export const VResizeHandle = () => (
    <PanelResizeHandle className="w-1.5 bg-border/40 hover:bg-primary/50 active:bg-primary transition-colors cursor-col-resize flex items-center justify-center -mx-0.5 z-10">
        <div className="w-0.5 h-8 bg-muted-foreground/30 rounded-full" />
    </PanelResizeHandle>
);

export const HResizeHandle = () => (
    <PanelResizeHandle className="h-1.5 bg-border/40 hover:bg-primary/50 active:bg-primary transition-colors cursor-row-resize flex items-center justify-center -my-0.5 z-10">
        <div className="h-0.5 w-8 bg-muted-foreground/30 rounded-full" />
    </PanelResizeHandle>
);
