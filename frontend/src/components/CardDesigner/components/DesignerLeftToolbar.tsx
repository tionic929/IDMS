
﻿import React, { useRef } from 'react';
import {
  MousePointer2, Move, Square, Circle as CircleIcon, Image as ImageIcon, Type

} from 'lucide-react';
import { useCanvasContext } from '../context/CanvasContext';
import { useLayerContext } from '../context/LayerContext';

const IconButton = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    title={label}

    className={`p-2.5 rounded-xl transition-all flex items-center justify-center border duration-300 ${active
      ? 'bg-primary/20 text-primary border-primary/40 shadow-lg shadow-primary/5 scale-105'
      : 'text-slate-500 bg-white border-transparent hover:bg-slate-100 hover:text-slate-900 active:scale-95'
      }`}
  >
    <Icon size={20} strokeWidth={2.5} />

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


      <div className="w-16 border-r border-slate-200 bg-white flex flex-col items-center py-6 gap-4 z-20 shrink-0">

        <IconButton
          icon={MousePointer2}
          active={activeTool === 'select'}
          onClick={() => setActiveTool('select')}

          label="Select (V)"

        />
        <IconButton
          icon={Move}
          active={activeTool === 'hand'}
          onClick={() => setActiveTool('hand')}

          label="Hand (Space)"
        />

        <div className="w-8 h-px bg-slate-100 my-2" />


        <IconButton
          icon={Square}
          onClick={() => addShape('rect')}

          label="Rectangle (R)"

        />
        <IconButton
          icon={CircleIcon}
          onClick={() => addShape('circle')}

          label="Circle (O)"
        />
        <IconButton
          icon={Type}
          onClick={addText}
          label="Text (T)"

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


