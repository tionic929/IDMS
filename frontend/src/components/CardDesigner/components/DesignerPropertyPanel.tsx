
import React, { useState } from 'react';
import { useDesignerContext } from '../context/DesignerContext';
import { useLayerContext } from '../context/LayerContext';

import {
  AlignLeft, AlignCenter, AlignRight,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  ArrowUp, ArrowDown, Trash2, MousePointer2,
  ArrowUpToLine, ArrowDownToLine, Unlock, Lock,
  Type, Image as ImageIcon, Layers, Move,
  Maximize2, Copy, Search, User, CreditCard, Building, Camera,
  RefreshCw, Layout, Square
} from 'lucide-react';

// ─── Shared sub-components ──────────────────────────────────────────

const PropertyGroup = ({
  title, children, icon: Icon
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ElementType
}) => (
  <div className="border-b border-border pb-5 mb-5 last:border-0 last:mb-0">
    <div className="flex items-center gap-2 mb-3.5">
      {Icon && <Icon size={11} className="text-muted-foreground" />}
      <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{title}</h3>
    </div>
    <div className="space-y-3.5">{children}</div>
  </div>
);

const Label = ({ children }: { children: string }) => (
  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5 ml-0.5">{children}</span>
);

/** Compact number input with label */
const NumInput = ({
  label, value, min, max, step = 1, onChange, suffix = ''
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  suffix?: string;
}) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between items-center">
      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
    <div className="flex items-center bg-muted/50 border border-border rounded-lg overflow-hidden focus-within:border-primary transition-colors">
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={Math.round(value)}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="flex-1 bg-transparent px-2 py-1.5 text-[11px] font-black text-foreground outline-none w-0 min-w-0 text-center"
      />
      {suffix && (
        <span className="pr-2 text-[9px] font-bold text-muted-foreground shrink-0">{suffix}</span>
      )}
    </div>
  </div>
);

/** Slider with value badge */
const SliderInput = ({
  label, value, min, max, step = 1, onChange, suffix = ''
}: {
  label: string; value: number; min: number; max: number;
  step?: number; onChange: (v: number) => void; suffix?: string;
}) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center">
      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-[10px] font-black text-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
        {Math.round(value)}{suffix}
      </span>
    </div>
    <input
      type="range"
      min={min} max={max} step={step} value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
    />
  </div>
);

const ToggleGroup = ({
  label, options, value, onChange
}: {
  label: string;
  options: { value: string; icon: React.ElementType; title: string }[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <Label>{label}</Label>
    <div className="flex gap-1 bg-muted p-1 rounded-lg border border-border">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          title={opt.title}
          className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-all ${value === opt.value
            ? 'bg-card shadow-sm text-foreground border border-border'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <opt.icon size={13} />
        </button>
      ))}
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────

export const DesignerPropertyPanel: React.FC = () => {
  const { 
    currentSideData, updateItem, editSide,
    previewData, overrides, setOverrides 
  } = useDesignerContext();
  const { selectedIds, handleDelete, moveLayer, handleDuplicate } = useLayerContext();
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;

  const [deleteArmed, setDeleteArmed] = useState(false);

  const updateOverride = (key: string, value: any) => {
    setOverrides({ ...overrides, [key]: value });
  };

  const isFront = editSide === 'FRONT';

  // Student Override Section - Rendered when no layer is selected OR as a top section
  const StudentDetailsSection = (
    <PropertyGroup title={`Application Details (${isFront ? "Big 4" : "Back View"})`} icon={User}>
      <div className="space-y-4">
        {isFront ? (
          <>
            <div>
              <Label>Full Name</Label>
              <input 
                type="text" 
                value={previewData?.fullName || ''} 
                onChange={(e) => updateOverride('fullName', e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <Label>Department / Course</Label>
              <input 
                type="text" 
                value={previewData?.course || ''} 
                onChange={(e) => updateOverride('course', e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <Label>Student ID</Label>
              <input 
                type="text" 
                value={previewData?.idNumber || ''} 
                onChange={(e) => updateOverride('idNumber', e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-primary transition-colors"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <Label>Guardian Name</Label>
              <input 
                type="text" 
                value={previewData?.guardian_name || ''} 
                onChange={(e) => updateOverride('guardian_name', e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <Label>Residential Address</Label>
              <textarea 
                value={previewData?.address || ''} 
                onChange={(e) => updateOverride('address', e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-primary transition-colors h-20 resize-none"
              />
            </div>
            <div>
              <Label>Guardian Contact</Label>
              <input 
                type="text" 
                value={previewData?.guardian_contact || ''} 
                onChange={(e) => updateOverride('guardian_contact', e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-primary transition-colors"
              />
            </div>
          </>
        )}

        <div>
          <Label>{isFront ? "Photo Override" : "Signature Override"}</Label>
          <button 
            onClick={() => document.getElementById('asset-override-input')?.click()}
            className="w-full h-24 bg-muted/50 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:bg-accent hover:border-primary transition-all overflow-hidden relative group"
          >
            {isFront ? (
              previewData?.photo ? (
                <img src={previewData.photo} className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera size={18} className="text-muted-foreground/50" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Upload Photo</span>
                </>
              )
            ) : (
              previewData?.signature ? (
                <img src={previewData.signature} className="w-full h-full object-contain p-2" />
              ) : (
                <>
                  <ImageIcon size={18} className="text-muted-foreground/50" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Upload Signature</span>
                </>
              )
            )}
            
            {(isFront ? previewData?.photo : previewData?.signature) && (
               <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <RefreshCw size={16} className="text-background animate-spin-hover" />
               </div>
            )}
          </button>
          <input 
            id="asset-override-input"
            type="file" 
            hidden 
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                updateOverride(isFront ? 'photo' : 'signature', url);
              }
            }}
          />
        </div>
      </div>
    </PropertyGroup>
  );

  // Empty state - Show Student Details even when nothing selected
  if (!selectedId || !currentSideData[selectedId]) {
    return (
      <div className="w-64 border-l border-border bg-card flex flex-col overflow-y-auto shrink-0 scrollbar-hide">
        <div className="px-4 py-6 border-b border-border flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
              <Layout size={20} className="text-primary-foreground" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-tight text-foreground">Application Info</h2>
            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Live data editing</p>
        </div>
        <div className="flex-1 px-4 py-4 space-y-4">
          {StudentDetailsSection}
        </div>
      </div>
    );
  }

  const config = currentSideData[selectedId];
  const isText = config.type === 'text' || (!config.type && !['photo', 'signature'].includes(selectedId));
  const isImage = config.type === 'image' || ['photo', 'signature'].includes(selectedId);
  const isShape = config.type === 'rect' || config.type === 'circle';
  const isRect = config.type === 'rect';

  const onDelete = () => {
    if (!deleteArmed) {
      setDeleteArmed(true);
      setTimeout(() => setDeleteArmed(false), 2500);
    } else {
      handleDelete(selectedIds);
      setDeleteArmed(false);
    }
  };

  return (
    <div className="w-64 border-l border-border bg-card flex flex-col overflow-y-auto shrink-0 scrollbar-hide">

      {/* ── HEADER ── */}
      <div className="px-4 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-primary rounded-lg shadow-md shadow-primary/10 shrink-0">
            {isText
              ? <Type size={14} className="text-primary-foreground" />
              : isImage
                ? <ImageIcon size={14} className="text-primary-foreground" />
                : <Layers size={14} className="text-primary-foreground" />
            }
          </div>
          <div className="min-w-0">
            <h2 className="text-[11px] font-black uppercase tracking-tight text-foreground truncate">
              {config.name || config.type || 'Element'}
            </h2>
            <span className="text-[9px] text-muted-foreground font-bold font-mono">#{selectedId.split('_')[0]}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => handleDuplicate(selectedIds)}
            title="Duplicate"
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={() => updateItem(selectedIds[0], { locked: !config.locked })}
            title={config.locked ? 'Unlock' : 'Lock'}
            className={`p-1.5 rounded-lg border transition-all ${config.locked
              ? 'bg-orange-500/10 border-orange-200 text-orange-600'
              : 'bg-muted border-border text-muted-foreground hover:text-foreground'
              }`}
          >
            {config.locked ? <Lock size={13} /> : <Unlock size={13} />}
          </button>
        </div>
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">

        {/* APPLICATION DETAILS (BIG 4) */}
        <div className="mb-6 border-b border-border pb-6">
           {StudentDetailsSection}
        </div>

        {/* ARRANGE GROUP */}
        <PropertyGroup title="Arrange" icon={Layers}>
          <div>
            <Label>Layer Order</Label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-muted rounded-lg border border-border">
              {([
                { dir: 'top' as const, icon: ArrowUpToLine, label: 'Bring to Front' },
                { dir: 'up' as const, icon: ArrowUp, label: 'Bring Forward' },
                { dir: 'down' as const, icon: ArrowDown, label: 'Send Backward' },
                { dir: 'bottom' as const, icon: ArrowDownToLine, label: 'Send to Back' },
              ]).map(({ dir, icon: Icon, label }) => (
                <button
                  key={dir}
                  onClick={() => moveLayer(dir)}
                  title={label}
                  className="p-2 hover:bg-card text-muted-foreground hover:text-foreground rounded-md transition-all hover:shadow-sm flex items-center justify-center"
                >
                  <Icon size={13} />
                </button>
              ))}
            </div>
          </div>
        </PropertyGroup>

        {/* TRANSFORM GROUP */}
        <PropertyGroup title="Transform" icon={Move}>

          {/* Position X/Y */}
          <div>
            <Label>Position</Label>
            <div className="grid grid-cols-2 gap-2">
              <NumInput label="X" value={config.x || 0} min={-500} max={1500} onChange={v => updateItem(selectedId, { x: v })} suffix="px" />
              <NumInput label="Y" value={config.y || 0} min={-500} max={1500} onChange={v => updateItem(selectedId, { y: v })} suffix="px" />
            </div>
          </div>

          {/* Width/Height */}
          <div>
            <Label>Size</Label>
            <div className="grid grid-cols-2 gap-2">
              <NumInput label="W" value={config.width || 0} min={1} max={2000} onChange={v => updateItem(selectedId, { width: v })} suffix="px" />
              <NumInput label="H" value={config.height || 0} min={1} max={2000} onChange={v => updateItem(selectedId, { height: v })} suffix="px" />
            </div>
          </div>

          {/* Rotation + Opacity sliders */}
          <SliderInput
            label="Rotation"
            value={config.rotation || 0}
            min={0} max={360}
            onChange={v => updateItem(selectedId, { rotation: v })}
            suffix="°"
          />
          <SliderInput
            label="Opacity"
            value={Math.round((config.opacity ?? 1) * 100)}
            min={0} max={100}
            onChange={v => updateItem(selectedId, { opacity: v / 100 })}
            suffix="%"
          />
        </PropertyGroup>

        {/* TYPOGRAPHY GROUP — text elements only */}
        {isText && (
          <PropertyGroup title="Typography" icon={Type}>

            {/* Content */}
            <div>
              <Label>Content</Label>
              <textarea
                value={config.text || ''}
                onChange={e => updateItem(selectedId, { text: e.target.value })}
                className="w-full bg-muted/50 border border-border rounded-lg p-2.5 text-xs font-medium text-foreground outline-none focus:border-primary transition-colors h-20 resize-none leading-relaxed"
                placeholder="Enter text…"
              />
            </div>

            {/* Font size + Line height */}
            <div className="grid grid-cols-2 gap-2">
              <NumInput
                label="Size"
                value={config.fontSize || 18}
                min={6} max={200}
                onChange={v => updateItem(selectedId, { fontSize: v })}
                suffix="px"
              />
              <NumInput
                label="Line H"
                value={config.lineHeight || 1}
                min={0.5} max={4}
                step={0.1}
                onChange={v => updateItem(selectedId, { lineHeight: v })}
                suffix="×"
              />
            </div>

            {/* Style toggles */}
            <div>
              <Label>Style</Label>
              <div className="flex gap-1 bg-muted p-1 rounded-lg border border-border">
                {([
                  { key: 'bold', label: 'B', title: 'Bold' },
                  { key: 'italic', label: 'I', title: 'Italic' },
                  { key: 'underline', label: 'U', title: 'Underline' },
                ] as const).map(({ key, label, title }) => (
                  <button
                    key={key}
                    onClick={() => updateItem(selectedIds[0], { [key]: !config[key] })}
                    title={title}
                    className={`flex-1 py-1.5 rounded-md text-xs font-black transition-all ${config[key]
                      ? 'bg-card text-foreground shadow-sm border border-border'
                      : 'text-muted-foreground hover:text-foreground'
                      } ${key === 'italic' ? 'italic' : ''} ${key === 'underline' ? 'underline' : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* H-Align / V-Align */}
            <div className="grid grid-cols-2 gap-2">
              <ToggleGroup
                label="H-Align"
                value={config.align || 'left'}
                onChange={v => updateItem(selectedId, { align: v })}
                options={[
                  { value: 'left', icon: AlignLeft, title: 'Left' },
                  { value: 'center', icon: AlignCenter, title: 'Center' },
                  { value: 'right', icon: AlignRight, title: 'Right' },
                ]}
              />
              <ToggleGroup
                label="V-Align"
                value={config.verticalAlign || 'middle'}
                onChange={v => updateItem(selectedId, { verticalAlign: v })}
                options={[
                  { value: 'top', icon: AlignStartVertical, title: 'Top' },
                  { value: 'middle', icon: AlignCenterVertical, title: 'Middle' },
                  { value: 'bottom', icon: AlignEndVertical, title: 'Bottom' },
                ]}
              />
            </div>

            {/* Color */}
            <div>
              <Label>Color</Label>
              <div className="flex items-center gap-2.5 p-1.5 bg-muted/50 border border-border rounded-lg">
                <input
                  type="color"
                  value={config.fill || '#000000'}
                  onChange={e => updateItem(selectedId, { fill: e.target.value })}
                  className="w-8 h-8 rounded-md cursor-pointer border-none bg-transparent"
                />
                <input
                  type="text"
                  value={(config.fill || '#000000').toUpperCase()}
                  onChange={e => updateItem(selectedId, { fill: e.target.value })}
                  className="flex-1 bg-transparent text-[10px] font-black font-mono tracking-widest text-muted-foreground outline-none uppercase"
                />
              </div>
            </div>

            {/* Overflow (was "Fitting Mode") */}
            <div>
              <Label>Overflow</Label>
              <div className="grid grid-cols-4 gap-0.5 bg-muted p-1 rounded-lg border border-border">
                {(['none', 'wrap', 'shrink', 'stretch'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => updateItem(selectedId, { fit: m })}
                    className={`px-1.5 py-1.5 text-[8px] uppercase font-black rounded-md transition-all ${config.fit === m
                      ? 'bg-card text-foreground shadow-sm border border-border'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Lines — only for shrink mode */}
            {config.fit === 'shrink' && (
              <NumInput
                label="Max Lines"
                value={config.maxLines || 1}
                min={1} max={20}
                onChange={v => updateItem(selectedId, { maxLines: Math.round(v) })}
              />
            )}
          </PropertyGroup>
        )}

        {/* SHAPE PROPERTIES GROUP */}
        {isShape && (
          <PropertyGroup title="Shape Properties" icon={Square}>
            {/* Fill Color */}
            <div>
              <Label>Fill Color</Label>
              <div className="flex items-center gap-2.5 p-1.5 bg-muted/50 border border-border rounded-lg">
                <input
                  type="color"
                  value={config.fill || '#6366f1'}
                  onChange={e => updateItem(selectedId, { fill: e.target.value })}
                  className="w-8 h-8 rounded-md cursor-pointer border-none bg-transparent"
                />
                <input
                  type="text"
                  value={(config.fill || '#6366f1').toUpperCase()}
                  onChange={e => updateItem(selectedId, { fill: e.target.value })}
                  className="flex-1 bg-transparent text-[10px] font-black font-mono tracking-widest text-muted-foreground outline-none uppercase"
                />
              </div>
            </div>

            {/* Corner Radius — Rect only */}
            {isRect && (
              <SliderInput
                label="Corner Radius"
                value={config.radius || 0}
                min={0} max={100}
                onChange={v => updateItem(selectedId, { radius: v })}
                suffix="px"
              />
            )}
          </PropertyGroup>
        )}

        {/* IMAGE INFO GROUP */}
        {isImage && (
          <PropertyGroup title="Image" icon={ImageIcon}>
            <div className="flex items-center gap-3 p-2.5 bg-muted/50 rounded-lg border border-border">
              <Maximize2 size={14} className="text-muted-foreground shrink-0" />
              <div className="text-[10px] text-muted-foreground font-bold">
                {Math.round(config.width || 0)} × {Math.round(config.height || 0)} px
              </div>
            </div>
          </PropertyGroup>
        )}
      </div>

      {/* ── DELETE ── */}
      <div className="px-4 py-4 border-t border-border shrink-0">
        <button
          onClick={onDelete}
          className={`w-full py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${deleteArmed
            ? 'bg-destructive text-destructive-foreground border-destructive shadow-lg shadow-destructive/20 animate-pulse'
            : 'bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground border-destructive/20 hover:border-destructive'
            }`}
        >
          <Trash2 size={13} />
          {deleteArmed ? 'Click again to confirm' : 'Remove Element'}
        </button>
      </div>
    </div>
  );
};
