import React from 'react';
import { useDesignerContext } from '../context/DesignerContext';
import { useLayerContext } from '../context/LayerContext';
import PropertyPanel from '../../../components/Designer/PropertyPanel';

export const DesignerPropertyPanel: React.FC = () => {
  const { currentSideData, updateItem } = useDesignerContext();
  const { selectedId, handleDelete, moveLayer } = useLayerContext();

  const isTextLayer = (id: string) =>
    !['photo', 'signature'].includes(id) &&
    !id.startsWith('rect') &&
    !id.startsWith('circle') &&
    !id.startsWith('img');

  return (
    <div className="w-72 border-l border-zinc-800 bg-zinc-900 p-6 flex flex-col gap-6 overflow-y-auto shrink-0">
      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">
        Properties
      </span>
      <PropertyPanel
        selectedId={selectedId}
        config={selectedId ? currentSideData[selectedId] : null}
        onUpdate={updateItem}
        onDelete={handleDelete}
        onMoveLayer={moveLayer}
        isTextLayer={isTextLayer}
      />
    </div>
  );
};