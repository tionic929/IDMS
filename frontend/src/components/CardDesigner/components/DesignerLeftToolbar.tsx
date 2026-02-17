import React, { useRef } from 'react';
import {
  MousePointer2, Move, Square, Circle as CircleIcon, Image as ImageIcon
} from 'lucide-react';
import { useCanvasContext } from '../context/CanvasContext';
import { useLayerContext } from '../context/LayerContext';

const IconButton = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    title={label}
    className={`p-2 rounded-lg transition-all flex items-center justify-center ${
      active
        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-transparent'
    }`}
  >
    <Icon size={18} strokeWidth={2} />
  </button>
);

export const DesignerLeftToolbar: React.FC = () => {
  const { activeTool, setActiveTool } = useCanvasContext();
  const { addShape, addText, handleImageUpload } = useLayerContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
      e.target.value = ''; // Reset input
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

      <div className="w-12 border-r border-zinc-800 bg-zinc-900 flex flex-col items-center py-4 gap-3 z-20 shrink-0">
        <IconButton
          icon={MousePointer2}
          active={activeTool === 'select'}
          onClick={() => setActiveTool('select')}
          label="Select"
        />
        <IconButton
          icon={Move}
          active={activeTool === 'hand'}
          onClick={() => setActiveTool('hand')}
          label="Pan"
        />

        <div className="w-4 h-px bg-zinc-800" />

        <IconButton
          icon={Square}
          onClick={() => addShape('rect')}
          label="Rectangle"
        />
        <IconButton
          icon={CircleIcon}
          onClick={() => addShape('circle')}
          label="Circle"
        />
        <IconButton
          icon={ImageIcon}
          onClick={() => fileInputRef.current?.click()}
          label="Upload Image"
        />
      </div>
    </>
  );
};