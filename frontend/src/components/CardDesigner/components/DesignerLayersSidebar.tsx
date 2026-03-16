
import React from 'react';
import { useDesignerContext } from '../context/DesignerContext';
import { useLayerContext } from '../context/LayerContext';
import {
  Layers, Type, Square, Circle as CircleIcon, Image as ImageIcon,
  Eye, EyeOff, Trash2, Focus, GripVertical, Copy, Group, Ungroup, CheckSquare
} from 'lucide-react';

const TYPE_ICON: Record<string, React.ElementType> = {
  text: Type,
  rect: Square,
  circle: CircleIcon,
  image: ImageIcon,
  group: Group,
};

function getIcon(id: string, config: any): React.ElementType {
  if (config.type && TYPE_ICON[config.type]) return TYPE_ICON[config.type];
  if (id.includes('text')) return Type;
  if (id.includes('rect')) return Square;
  if (id.includes('circle')) return CircleIcon;
  return ImageIcon;
}

function getDefaultName(id: string, config: any): string {
  if (config.name) return config.name;
  const typePart = config.type || id.split('_')[0];
  const labels: Record<string, string> = {
    text: 'Text', rect: 'Rectangle', circle: 'Circle',
    image: 'Image', img: 'Image', photo: 'Photo', signature: 'Signature'
  };
  const label = labels[typePart] || typePart;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export const DesignerLayersSidebar: React.FC = () => {
  const { currentSideData, editSide, setEditSide, updateItem } = useDesignerContext();
  const {
    selectedIds,
    setSelectedIds,
    toggleSelection,
    handleDelete,
    handleDuplicate,
    handleToggleVisibility,
    handleAutoFitLayer,
    handleGroupSelected,
    handleUngroup,
    hoveredId,
    setHoveredId
  } = useLayerContext();

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const layers = currentSideData ? Object.entries(currentSideData) : [];

  const startRename = (id: string, config: any) => {
    setEditingId(id);
    setEditingName(config.name || getDefaultName(id, config));
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const commitRename = () => {
    if (editingId && editingName.trim()) {
      updateItem(editingId, { name: editingName.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="w-56 border-r border-border bg-card flex flex-col z-10 shrink-0">

      {/* SIDE SWITCHER */}
      <div className="p-3 border-b border-border bg-muted/50">
        <div className="flex bg-muted p-1 rounded-lg border border-border shadow-inner">
          {(['FRONT', 'BACK'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setEditSide(s); setSelectedIds([]); }}
              className={`flex-1 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${editSide === s
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* HEADER */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-card sticky top-0 shadow-sm z-10">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Layers</h2>
        <div className="flex items-center gap-1.5">
          {selectedIds.length > 1 && (
            <button
              onClick={handleGroupSelected}
              className="p-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              title="Group Selected"
            >
              <Group size={11} />
            </button>
          )}
          <Layers size={12} className="text-muted-foreground/30" />
        </div>
      </div>

      {/* LAYER LIST */}
      <div className="flex-1 overflow-auto p-2 space-y-0.5 scrollbar-hide">
        {layers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 opacity-20">
            <Layers size={28} strokeWidth={1} />
            <span className="text-[10px] mt-2 font-bold uppercase tracking-tighter text-muted-foreground">No Layers</span>
          </div>
        ) : (
            [...layers].reverse().map(([id, config]: any) => {
              const Icon = getIcon(id, config);
              const name = getDefaultName(id, config);
              const isSelected = selectedIds.includes(id);
              const isHidden = config.visible === false;
              const isHovered = hoveredId === id;
              const isGroup = config.type === 'group';
              const isChild = !!config.groupId;

              return (
                <div
                  key={id}
                  onClick={(e) => toggleSelection(id, e.ctrlKey || e.metaKey || e.shiftKey)}
                  onDoubleClick={() => startRename(id, config)}
                  onMouseEnter={() => setHoveredId(id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`
                    group flex items-center gap-2 px-2 py-2 rounded-lg transition-all cursor-pointer border
                    ${isSelected
                      ? 'bg-primary border-primary text-primary-foreground shadow-md'
                      : isHovered 
                          ? 'bg-accent border-accent text-accent-foreground' 
                          : 'hover:bg-muted/50 border-transparent text-muted-foreground hover:text-foreground'
                    }
                    ${isHidden ? 'opacity-50' : ''}
                    ${isChild ? 'ml-4 scale-[0.98] border-l-2 border-l-border' : ''}
                  `}
                >
                {/* Drag handle (visual affordance) */}
                <GripVertical
                  size={12}
                  className={`shrink-0 cursor-grab ${isSelected ? 'text-primary-foreground/30' : 'text-muted-foreground/30 group-hover:text-muted-foreground/50'}`}
                />

                {/* Type icon */}
                <div className={`p-1 rounded-lg shrink-0 border border-transparent transition-colors ${isSelected || isHovered ? 'bg-primary-foreground/20' : 'bg-muted group-hover:bg-card border-border/50'}`}>
                  <Icon size={11} className={isSelected || isHovered ? 'text-primary-foreground' : 'text-muted-foreground'} />
                </div>

                {/* Name — editable on double-click */}
                {editingId === id ? (
                  <input
                    ref={inputRef}
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingId(null); }}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 min-w-0 text-[11px] font-bold bg-card text-foreground rounded-md px-1.5 py-0.5 outline-none border border-border shadow-sm"
                  />
                ) : (
                  <span className={`flex-1 text-[11px] font-bold truncate ${isSelected ? 'text-primary-foreground' : 'text-foreground/80'}`} title={config.name || name}>
                    {config.name || name}
                  </span>
                )}

                <div className={`flex items-center gap-0.5 transition-opacity duration-150 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {isGroup && (
                    <button
                      onClick={e => { e.stopPropagation(); handleUngroup(id); }}
                      className={`p-1 rounded-md transition-colors ${isSelected ? 'hover:bg-primary-foreground/20 text-primary-foreground/70 hover:text-primary-foreground' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}`}
                      title="Ungroup"
                    >
                      <Ungroup size={11} />
                    </button>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); handleAutoFitLayer(id); }}
                    className={`p-1 rounded-md transition-colors ${isSelected ? 'hover:bg-primary-foreground/20 text-primary-foreground/70 hover:text-primary-foreground' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}`}
                    title="Fit to Screen / Auto-size"
                  >
                    <Focus size={11} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleToggleVisibility(id); }}
                    className={`p-1 rounded-md transition-colors ${isSelected ? 'hover:bg-primary-foreground/20 text-primary-foreground/70 hover:text-primary-foreground' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}`}
                    title={isHidden ? 'Show Layer' : 'Hide Layer'}
                  >
                    {isHidden ? <EyeOff size={11} /> : <Eye size={11} />}
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDuplicate([id]); }}
                    className={`p-1 rounded-md transition-colors ${isSelected ? 'hover:bg-primary-foreground/20 text-primary-foreground/70 hover:text-primary-foreground' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}`}
                    title="Duplicate Layer"
                  >
                    <Copy size={11} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete([id]); }}
                    className={`p-1 rounded-md transition-colors ${isSelected ? 'hover:bg-destructive text-primary-foreground/70 hover:text-primary-foreground' : 'hover:bg-destructive/10 text-muted-foreground hover:text-destructive'}`}
                    title="Delete Layer"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER */}
      <div className="px-4 py-3 border-t border-border bg-muted/50">
        <div className="flex items-center justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          <span className="bg-muted px-2 py-0.5 rounded-full text-muted-foreground border border-border text-[9px]">
            {layers.length} layer{layers.length !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {editSide}
          </span>
        </div>
      </div>
    </div>
  );
};
