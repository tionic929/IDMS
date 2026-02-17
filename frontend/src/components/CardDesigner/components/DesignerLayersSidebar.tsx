import React, { useRef } from 'react';
import { useDesignerContext } from '../context/DesignerContext';
import { useLayerContext } from '../context/LayerContext';
import SidebarLayers from '../../../components/Designer/SidebarLayers';

export const DesignerLayersSidebar: React.FC = () => {
  const { editSide, setEditSide, currentSideData } = useDesignerContext();
  const {
    selectedId,
    setSelectedId,
    addShape,
    addText,
    handleDuplicate,
    handleDelete,
    handleToggleVisibility,
    handleRename,
    handleImageUpload
  } = useLayerContext();

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

      <div className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col z-10 shrink-0">
        {/* Side Switcher */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            {['FRONT', 'BACK'].map((s: any) => (
              <button
                key={s}
                onClick={() => {
                  setEditSide(s);
                  setSelectedId(null);
                }}
                className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                  editSide === s
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {s} SIDE
              </button>
            ))}
          </div>
        </div>

        {/* Layers List */}
        <SidebarLayers
          layers={currentSideData}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAddShape={addShape}
          onAddText={addText}
          onUploadImage={() => fileInputRef.current?.click()}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onToggleVisibility={handleToggleVisibility}
          onRename={handleRename}
        />
      </div>
    </>
  );
};