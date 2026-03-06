
import React, { useState } from 'react';
import { useDesignerContext } from '../context/DesignerContext';
import { useLayerContext } from '../context/LayerContext';

import {
  AlignLeft, AlignCenter, AlignRight,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  ArrowUp, ArrowDown, Trash2, MousePointer2,
  ArrowUpToLine, ArrowDownToLine, Unlock, Lock,
  Type, Image as ImageIcon, Layers, Move,
  Maximize2, Copy
} from 'lucide-react';

// ─── Shared sub-components ──────────────────────────────────────────

const PropertyGroup = ({
  title, children, icon: Icon
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ElementType
}) => (
  <div className="border-b border-slate-100 pb-5 mb-5 last:border-0 last:mb-0">
    <div className="flex items-center gap-2 mb-3.5">
      {Icon && <Icon size={11} className="text-slate-400" />}
      <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">{title}</h3>
    </div>
    <div className="space-y-3.5">{children}</div>
  </div>
);

const Label = ({ children }: { children: string }) => (
  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 ml-0.5">{children}</span>
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
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{label}</span>
    </div>
    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden focus-within:border-slate-900 transition-colors">
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={Math.round(value)}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="flex-1 bg-transparent px-2 py-1.5 text-[11px] font-black text-slate-900 outline-none w-0 min-w-0 text-center"
      />
      {suffix && (
        <span className="pr-2 text-[9px] font-bold text-slate-400 shrink-0">{suffix}</span>
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
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
        {Math.round(value)}{suffix}
      </span>
    </div>
    <input
      type="range"
      min={min} max={max} step={step} value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-900"
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
    <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          title={opt.title}
          className={`flex-1 flex items-center justify-center p-1.5 rounded-lg transition-all ${value === opt.value
            ? 'bg-white shadow-sm text-slate-900 border border-slate-200/50'
            : 'text-slate-400 hover:text-slate-600'
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
  const { currentSideData, updateItem } = useDesignerContext();
  const { selectedId, handleDelete, moveLayer, handleDuplicate } = useLayerContext();

  const [deleteArmed, setDeleteArmed] = useState(false);

  // Empty state
  if (!selectedId || !currentSideData[selectedId]) {
    return (
      <div className="w-64 border-l border-slate-200 bg-white flex flex-col items-center justify-center p-8 text-center shrink-0">
        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 border border-slate-100 shadow-sm">
          <MousePointer2 size={22} className="text-slate-300" strokeWidth={1.5} />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Properties</h3>
        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed font-medium px-2">
          Select an element on the canvas to view and edit its properties.
        </p>
      </div>
    );
  }

  const config = currentSideData[selectedId];
  const isText = config.type === 'text' || (!config.type && !['photo', 'signature'].includes(selectedId));
  const isImage = config.type === 'image' || ['photo', 'signature'].includes(selectedId);

  const onDelete = () => {
    if (!deleteArmed) {
      setDeleteArmed(true);
      setTimeout(() => setDeleteArmed(false), 2500);
    } else {
      handleDelete(selectedId);
      setDeleteArmed(false);
    }
  };

  return (
    <div className="w-64 border-l border-slate-200 bg-white flex flex-col overflow-y-auto shrink-0 scrollbar-hide">

      {/* ── HEADER ── */}
      <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-slate-900 rounded-xl shadow-md shadow-slate-900/10 shrink-0">
            {isText
              ? <Type size={14} className="text-white" />
              : isImage
                ? <ImageIcon size={14} className="text-white" />
                : <Layers size={14} className="text-white" />
            }
          </div>
          <div className="min-w-0">
            <h2 className="text-[11px] font-black uppercase tracking-tight text-slate-900 truncate">
              {config.name || config.type || 'Element'}
            </h2>
            <span className="text-[9px] text-slate-400 font-bold font-mono">#{selectedId.split('_')[0]}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => handleDuplicate(selectedId)}
            title="Duplicate"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={() => updateItem(selectedId, { locked: !config.locked })}
            title={config.locked ? 'Unlock' : 'Lock'}
            className={`p-1.5 rounded-lg border transition-all ${config.locked
              ? 'bg-orange-500/10 border-orange-200 text-orange-600'
              : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-900'
              }`}
          >
            {config.locked ? <Lock size={13} /> : <Unlock size={13} />}
          </button>
        </div>
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">

        {/* ARRANGE GROUP */}
        <PropertyGroup title="Arrange" icon={Layers}>
          <div>
            <Label>Layer Order</Label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-50 rounded-xl border border-slate-200">
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
                  className="p-2 hover:bg-white text-slate-400 hover:text-slate-900 rounded-lg transition-all hover:shadow-sm flex items-center justify-center"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 outline-none focus:border-slate-900 transition-colors h-20 resize-none leading-relaxed"
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
              <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                {([
                  { key: 'bold', label: 'B', title: 'Bold' },
                  { key: 'italic', label: 'I', title: 'Italic' },
                  { key: 'underline', label: 'U', title: 'Underline' },
                ] as const).map(({ key, label, title }) => (
                  <button
                    key={key}
                    onClick={() => updateItem(selectedId, { [key]: !config[key] })}
                    title={title}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${config[key]
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                      : 'text-slate-400 hover:text-slate-600'
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
              <div className="flex items-center gap-2.5 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="color"
                  value={config.fill || '#000000'}
                  onChange={e => updateItem(selectedId, { fill: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                />
                <input
                  type="text"
                  value={(config.fill || '#000000').toUpperCase()}
                  onChange={e => updateItem(selectedId, { fill: e.target.value })}
                  className="flex-1 bg-transparent text-[10px] font-black font-mono tracking-widest text-slate-600 outline-none uppercase"
                />
              </div>
            </div>

            {/* Overflow (was "Fitting Mode") */}
            <div>
              <Label>Overflow</Label>
              <div className="grid grid-cols-4 gap-0.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                {(['none', 'wrap', 'shrink', 'stretch'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => updateItem(selectedId, { fit: m })}
                    className={`px-1.5 py-1.5 text-[8px] uppercase font-black rounded-lg transition-all ${config.fit === m
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-400 hover:text-slate-600'
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

        {/* IMAGE INFO GROUP */}
        {isImage && (
          <PropertyGroup title="Image" icon={ImageIcon}>
            <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <Maximize2 size={14} className="text-slate-400 shrink-0" />
              <div className="text-[10px] text-slate-500 font-bold">
                {Math.round(config.width || 0)} × {Math.round(config.height || 0)} px
              </div>
            </div>
          </PropertyGroup>
        )}
      </div>

      {/* ── DELETE ── */}
      <div className="px-4 py-4 border-t border-slate-100 shrink-0">
        <button
          onClick={onDelete}
          className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${deleteArmed
            ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20 animate-pulse'
            : 'bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border-red-200 hover:border-red-500'
            }`}
        >
          <Trash2 size={13} />
          {deleteArmed ? 'Click again to confirm' : 'Remove Element'}
        </button>
      </div>
    </div>
  );
};
