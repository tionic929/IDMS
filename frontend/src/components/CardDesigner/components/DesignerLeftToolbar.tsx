
import React, { useRef } from 'react';
import {
  MousePointer2, Move, Square, Circle as CircleIcon, Image as ImageIcon, Type
} from 'lucide-react';
import { useCanvasContext } from '../context/CanvasContext';
import { useLayerContext } from '../context/LayerContext';

interface ToolDef {
  icon: React.ElementType;
  label: string;
  shortcut: string;
  tool?: 'select' | 'hand';
  action?: () => void;
  isCreate?: boolean;
}

const Tooltip = ({ label, shortcut }: { label: string; shortcut: string }) => (
  <div className="
    absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50
    bg-slate-900 text-white text-[10px] font-bold rounded-lg px-2.5 py-1.5
    whitespace-nowrap pointer-events-none shadow-xl
    opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-300
    flex items-center gap-2
  ">
    <span>{label}</span>
    <span className="bg-white/20 border border-white/20 px-1 py-0.5 rounded text-[9px] font-black">{shortcut}</span>
    {/* Arrow */}
    <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
  </div>
);

const ToolButton = ({
  icon: Icon, label, shortcut, active, onClick, isCreate
}: {
  icon: React.ElementType;
  label: string;
  shortcut: string;
  active?: boolean;
  onClick: () => void;
  isCreate?: boolean;
}) => (
  <div className="relative group">
    <button
      onClick={onClick}
      title={`${label} (${shortcut})`}
      className={`
        relative p-2.5 rounded-lg transition-all flex items-center justify-center border duration-200
        ${active
          ? 'bg-foreground text-background border-foreground shadow-lg shadow-foreground/10'
          : isCreate
            ? 'text-muted-foreground bg-card border-border hover:bg-accent hover:text-foreground hover:border-border active:scale-95'
            : 'text-muted-foreground bg-card border-transparent hover:bg-accent hover:text-foreground active:scale-95'
        }
      `}
    >
      <Icon size={18} strokeWidth={active ? 2.5 : 2} />
      {/* Shortcut badge bottom-right */}
      <span className={`
        absolute bottom-0.5 right-0.5 text-[7px] font-black leading-none
        ${active ? 'text-background/50' : 'text-muted-foreground/30'}
      `}>
        {shortcut}
      </span>
    </button>
    <Tooltip label={label} shortcut={shortcut} />
  </div>
);

export const DesignerLeftToolbar: React.FC = () => {
  const { activeTool, setActiveTool } = useCanvasContext();
  const { addShape, addText, handleImageUpload } = useLayerContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
      e.target.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      <div className="w-14 border-r border-border bg-card flex flex-col items-center py-5 gap-2 z-20 shrink-0">

        {/* Navigation tools */}
        <ToolButton
          icon={MousePointer2}
          label="Select"
          shortcut="V"
          active={activeTool === 'select'}
          onClick={() => setActiveTool('select')}
        />
        <ToolButton
          icon={Move}
          label="Hand / Pan"
          shortcut="H"
          active={activeTool === 'hand'}
          onClick={() => setActiveTool('hand')}
        />

        {/* Divider */}
        <div className="w-6 h-px bg-border my-1.5" />

        {/* Creation tools */}
        <ToolButton
          icon={Square}
          label="Rectangle"
          shortcut="R"
          isCreate
          onClick={() => { addShape('rect'); setActiveTool('select'); }}
        />
        <ToolButton
          icon={CircleIcon}
          label="Circle"
          shortcut="O"
          isCreate
          onClick={() => { addShape('circle'); setActiveTool('select'); }}
        />
        <ToolButton
          icon={Type}
          label="Text"
          shortcut="T"
          isCreate
          onClick={() => { addText(); setActiveTool('select'); }}
        />
        <ToolButton
          icon={ImageIcon}
          label="Image"
          shortcut="I"
          isCreate
          onClick={() => fileInputRef.current?.click()}
        />
      </div>
    </>
  );
};
