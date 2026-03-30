import React, { useState, useRef, useCallback, useEffect } from "react";
import { useSystemSettings } from "@/context/SystemSettingsContext";
import {
  Sun, Moon, Monitor, Type, Palette, RotateCcw,
  Layout, Sparkles, Check, SlidersHorizontal, Eye, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type SectionId = "appearance" | "color" | "geometry" | "preview";

// ─────────────────────────────────────────────────────────────────────────────
// Color presets — neutrals first, saturated second
// ─────────────────────────────────────────────────────────────────────────────
const PRESETS: {
  group: string;
  items: { label: string; hue: number; sat: number; swatch: string }[];
}[] = [
    {
      group: "Neutrals & Grayscale",
      items: [
        { label: "Black", hue: 0, sat: 0, swatch: "hsl(0,0%,15%)" },
        { label: "Neutral", hue: 0, sat: 0, swatch: "hsl(0,0%,45%)" },
        { label: "White", hue: 0, sat: 0, swatch: "hsl(0,0%,75%)" },
        { label: "Slate", hue: 215, sat: 16, swatch: "hsl(215,16%,47%)" },
        { label: "Gray", hue: 220, sat: 9, swatch: "hsl(220,9%,46%)" },
        { label: "Zinc", hue: 240, sat: 5, swatch: "hsl(240,5%,45%)" },
        { label: "Stone", hue: 25, sat: 5, swatch: "hsl(25,5%,45%)" },
      ],
    },
    {
      group: "Saturated",
      items: [
        { label: "Indigo", hue: 239, sat: 70, swatch: "hsl(239,70%,55%)" },
        { label: "Violet", hue: 262, sat: 70, swatch: "hsl(262,70%,55%)" },
        { label: "Rose", hue: 340, sat: 70, swatch: "hsl(340,70%,55%)" },
        { label: "Orange", hue: 25, sat: 70, swatch: "hsl(25,70%,55%)" },
        { label: "Amber", hue: 45, sat: 70, swatch: "hsl(45,70%,50%)" },
        { label: "Emerald", hue: 152, sat: 70, swatch: "hsl(152,70%,42%)" },
        { label: "Cyan", hue: 190, sat: 70, swatch: "hsl(190,70%,45%)" },
        { label: "Sky", hue: 204, sat: 70, swatch: "hsl(204,70%,50%)" },
      ],
    },
  ];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function accentColor(hue: number, sat: number, l = 50) {
  return `hsl(${hue},${sat}%,${l}%)`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2-D Color picker  (saturation square + hue strip)
// x-axis = saturation (0 → 100), we keep lightness at 50 for the accent token
// ─────────────────────────────────────────────────────────────────────────────
const ColorPicker: React.FC<{
  hue: number;
  sat: number;
  light: number;
  onHueChange: (h: number) => void;
  onSatChange: (s: number) => void;
  onLightChange: (l: number) => void;
}> = ({ hue, sat, light, onHueChange, onSatChange, onLightChange }) => {
  const squareRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"square" | "hue" | null>(null);

  const readSquare = useCallback((e: MouseEvent | React.MouseEvent) => {
    const el = squareRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    onSatChange(Math.round(x * 100));
    onLightChange(Math.round(100 - y * 100));
  }, [onSatChange, onLightChange]);

  const readHue = useCallback((e: MouseEvent | React.MouseEvent) => {
    const el = hueRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onHueChange(Math.round(x * 360));
  }, [onHueChange]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging.current === "square") readSquare(e);
      if (dragging.current === "hue") readHue(e);
    };
    const onUp = () => { dragging.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [readSquare, readHue]);

  const preview = accentColor(hue, sat, light);

  return (
    <div className="space-y-3 select-none">
      {/* Saturation square: white → hue color (x), transparent → black (y overlay) */}
      <div
        ref={squareRef}
        className="relative w-full h-36 rounded-xl overflow-hidden cursor-crosshair border border-border/60"
        style={{
          background: `
            linear-gradient(to bottom, transparent 0%, #000 100%),
            linear-gradient(to right, #fff 0%, hsl(${hue},100%,50%) 100%)
          `,
        }}
        onMouseDown={(e) => { dragging.current = "square"; readSquare(e); }}
      >
        {/* Thumb — x = saturation % */}
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg ring-1 ring-black/20 pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${sat}%`,
            top: `${100 - light}%`,
            background: preview,
          }}
        />
      </div>

      {/* Hue strip */}
      <div
        ref={hueRef}
        className="relative w-full h-4 rounded-full overflow-hidden cursor-crosshair border border-border/60"
        style={{
          background:
            "linear-gradient(to right,hsl(0,100%,50%),hsl(60,100%,50%),hsl(120,100%,50%),hsl(180,100%,50%),hsl(240,100%,50%),hsl(300,100%,50%),hsl(360,100%,50%))",
        }}
        onMouseDown={(e) => { dragging.current = "hue"; readHue(e); }}
      >
        <div
          className="absolute top-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg ring-1 ring-black/20 pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${(hue / 360) * 100}%`, background: `hsl(${hue},100%,50%)` }}
        />
      </div>

      {/* Value readout row */}
      <div className="flex items-center gap-3 pt-1">
        <div
          className="w-10 h-10 rounded-xl border border-border/60 flex-shrink-0 transition-all duration-150"
          style={{
            background: preview,
            boxShadow: sat > 5 ? `0 4px 16px ${preview}55` : undefined,
          }}
        />
        <div className="flex-1 space-y-0.5">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current accent</div>
          <div className="text-[13px] font-black tabular-nums" style={{ color: sat > 5 ? preview : undefined }}>
            {sat === 0 ? "Grayscale" : `${hue}° hue`} · {sat}% sat · {light}% light
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">
            hsl({hue}, {sat}%, {light}%)
          </div>
        </div>
        {sat <= 5 && (
          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-muted text-muted-foreground border border-border/50">
            Neutral
          </span>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable components
// ─────────────────────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{
  icon: React.ElementType; title: string; description: string;
}> = ({ icon: Icon, title, description }) => (
  <div className="pb-6 border-b border-border/40 space-y-2">
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground">{title}</h2>
    </div>
    <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

const SliderRow: React.FC<{
  label: string; hint: string; value: string;
  min: number; max: number; step?: number; currentValue: number;
  onChange: (v: number) => void;
}> = ({ label, hint, value, min, max, step = 1, currentValue, onChange }) => (
  <div className="space-y-3 p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card/70 hover:border-primary/20 transition-all duration-200">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-[12px] font-bold text-foreground">{label}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>
      </div>
      <span className="text-[11px] font-black tabular-nums bg-primary/10 text-primary px-2.5 py-1 rounded-lg border border-primary/15">
        {value}
      </span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={currentValue}
      onChange={(e) => onChange(step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-muted"
    />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar nav config
// ─────────────────────────────────────────────────────────────────────────────
const NAV_ITEMS: { id: SectionId; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "appearance", label: "Appearance", icon: Sun, desc: "Theme & display mode" },
  { id: "color", label: "Color", icon: Palette, desc: "Accent & brand hue" },
  { id: "geometry", label: "Geometry", icon: SlidersHorizontal, desc: "Scale & font size" },
  { id: "preview", label: "Preview", icon: Eye, desc: "Live component view" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSystemSettings();
  const [active, setActive] = useState<SectionId>("appearance");

  const hue = settings.themeHue;
  const sat = settings.themeSat ?? 70;
  const light = settings.themeLight ?? 50;
  const accent = accentColor(hue, sat, light);

  const appearanceModes = [
    { id: "light", icon: Sun, label: "Light", desc: "Clean and bright" },
    { id: "dark", icon: Moon, label: "Dark", desc: "Easy on the eyes" },
    { id: "system", icon: Monitor, label: "System", desc: "Follows your OS" },
  ] as const;

  return (
    <div className="flex h-full min-h-screen bg-background">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Settings sidebar                                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <aside className="w-56 shrink-0 border-r border-border/60 flex flex-col bg-muted/20 sticky top-0 h-screen overflow-hidden">

        {/* Branding */}
        <div className="px-5 pt-7 pb-5 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[12px] font-black uppercase tracking-[0.12em] text-foreground leading-none">
                Settings
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-1">
                Preferences
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon, desc }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                  strokeWidth={2.5}
                />
                <div className="min-w-0 flex-1">
                  <div className={cn(
                    "text-[11px] font-black uppercase tracking-tight leading-none",
                    isActive ? "text-primary-foreground" : "text-foreground"
                  )}>
                    {label}
                  </div>
                  <div className={cn(
                    "text-[10px] mt-0.5 truncate",
                    isActive ? "text-primary-foreground/65" : "text-muted-foreground"
                  )}>
                    {desc}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Reset */}
        <div className="p-3 border-t border-border/40">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetSettings}
            className="w-full gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8"
          >
            <RotateCcw className="w-3 h-3" />
            Reset defaults
          </Button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Content panel                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto">
        <div
          key={active}  /* re-triggers animation on tab switch */
          className="max-w-xl mx-auto px-8 py-10 space-y-7 animate-in fade-in slide-in-from-right-2 duration-250"
        >

          {/* ─────────── Appearance ─────────── */}
          {active === "appearance" && (
            <div className="space-y-6">
              <SectionHeader
                icon={Sun}
                title="Appearance"
                description="Choose how the application looks for you based on lighting and preference."
              />

              <div className="grid grid-cols-3 gap-3">
                {appearanceModes.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = settings.themeMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => updateSettings({ themeMode: mode.id as any })}
                      className={cn(
                        "relative flex flex-col items-start gap-3 p-4 rounded-2xl border text-left transition-all duration-200 group",
                        isActive
                          ? "border-primary bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary/25"
                          : "border-border/60 bg-card hover:border-primary/25 hover:bg-card/80"
                      )}
                    >
                      {isActive && (
                        <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-primary flex items-center justify-center animate-in zoom-in duration-200">
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </div>
                      )}
                      <div className={cn(
                        "p-2 rounded-lg transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className={cn("text-[12px] font-black uppercase tracking-tight", isActive ? "text-primary" : "text-foreground")}>
                          {mode.label}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{mode.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Mini UI preview */}
              <div className="rounded-2xl border border-border/60 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border/40 bg-muted/30">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Preview</span>
                </div>
                <div className="p-5 bg-card space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <Zap className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="text-[13px] font-black text-foreground">NC ID Tech</div>
                      <div className="text-[10px] text-muted-foreground">Management System</div>
                    </div>
                    <div className="ml-auto flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-2/3 rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-7 rounded-lg bg-muted" />
                    <div className="h-7 rounded-lg bg-primary" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─────────── Color ─────────── */}
          {active === "color" && (
            <div className="space-y-6">
              <SectionHeader
                icon={Palette}
                title="Brand Color"
                description="Pick any hue and drag saturation to 0 for pure slate, gray, or black & white themes."
              />

              {/* 2D picker */}
              <div className="p-5 rounded-2xl border border-border/60 bg-card/40 space-y-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Color picker
                </div>
                <ColorPicker
                  hue={hue} sat={sat} light={light}
                  onHueChange={(h) => updateSettings({ themeHue: h })}
                  onSatChange={(s) => updateSettings({ themeSat: s })}
                  onLightChange={(l) => updateSettings({ themeLight: l })}
                />
              </div>

              {/* Neutral info banner */}
              {sat <= 8 && (
                <div className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-muted/30 animate-in fade-in duration-200">
                  <div
                    className="w-7 h-7 rounded-lg flex-shrink-0 border border-border/50"
                    style={{ background: `hsl(${hue},${sat}%,50%)` }}
                  />
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wider text-foreground">
                      {sat === 0 ? "Grayscale / Monochrome" : "Near-neutral mode"}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                      At {sat}% saturation your accent is essentially achromatic — perfect for slate, charcoal, or black-and-white themes.
                    </div>
                  </div>
                </div>
              )}

              {/* Preset groups */}
              <div className="space-y-5">
                {PRESETS.map((group) => (
                  <div key={group.group} className="space-y-2.5">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {group.group}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((p) => {
                        const isActive = settings.themeHue === p.hue && Math.abs(sat - p.sat) < 5;
                        return (
                          <button
                            key={p.label}
                            onClick={() => { updateSettings({ themeHue: p.hue, themeSat: p.sat }); }}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all duration-200",
                              isActive
                                ? "border-transparent text-white shadow-md"
                                : "border-border/60 bg-card text-muted-foreground hover:border-border hover:text-foreground"
                            )}
                            style={isActive ? { backgroundColor: p.swatch, boxShadow: `0 4px 12px ${p.swatch}66` } : {}}
                          >
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0 border border-white/20"
                              style={{ backgroundColor: p.swatch }}
                            />
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─────────── Geometry ─────────── */}
          {active === "geometry" && (
            <div className="space-y-6">
              <SectionHeader
                icon={SlidersHorizontal}
                title="Geometry"
                description="Control text size and structural density across the entire application."
              />

              <div className="space-y-3">
                <SliderRow
                  label="Base Font Size"
                  hint="Default text scale for the entire system"
                  value={`${settings.fontSize}px`}
                  min={12} max={20} currentValue={settings.fontSize}
                  onChange={(v) => updateSettings({ fontSize: v })}
                />
                <SliderRow
                  label="Interface Density"
                  hint="Scale components inwards or outwards uniformly"
                  value={`${(settings.componentScale * 100).toFixed(0)}%`}
                  min={0.8} max={1.2} step={0.05} currentValue={settings.componentScale}
                  onChange={(v) => updateSettings({ componentScale: v })}
                />
              </div>

              {/* Density visual guide */}
              <div className="p-5 rounded-2xl border border-border/60 bg-card/40 space-y-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Scale reference
                </div>
                <div className="flex items-end gap-3">
                  {[0.8, 0.9, 1.0, 1.1, 1.2].map((s) => {
                    const isActive = Math.abs(settings.componentScale - s) < 0.03;
                    return (
                      <button
                        key={s}
                        onClick={() => updateSettings({ componentScale: s })}
                        className="flex flex-col items-center gap-2 flex-1 group"
                      >
                        <div
                          className={cn(
                            "w-full rounded-lg border-2 transition-all duration-200",
                            isActive
                              ? "border-primary bg-primary/15"
                              : "border-border/40 bg-muted/40 group-hover:border-primary/30"
                          )}
                          style={{ height: `${s * 36}px` }}
                        />
                        <span className={cn(
                          "text-[10px] font-black tabular-nums",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}>
                          {(s * 100).toFixed(0)}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─────────── Preview ─────────── */}
          {active === "preview" && (
            <div className="space-y-6">
              <SectionHeader
                icon={Eye}
                title="Live Preview"
                description="See how your current settings affect real UI components in real time."
              />

              {/* Stats bar */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Mode", value: settings.themeMode, icon: Sun },
                  { label: "Scale", value: `${(settings.componentScale * 100).toFixed(0)}%`, icon: Layout },
                  { label: "Color", value: sat <= 5 ? "Neutral" : `${hue}°`, icon: Palette },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="p-4 rounded-xl border border-border/60 bg-card/40 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <Icon className="w-3 h-3" />
                      {label}
                    </div>
                    <div className="text-[14px] font-black tabular-nums text-foreground capitalize">
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Scaled mock card */}
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-10 flex items-center justify-center overflow-hidden relative min-h-[300px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] [background-size:20px_20px] opacity-50" />
                {sat > 5 && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at 50% 0%, ${accent}18, transparent 70%)` }}
                  />
                )}

                <div
                  className="relative z-10 w-full max-w-xs bg-background border border-border rounded-2xl shadow-2xl overflow-hidden transition-transform duration-300 ease-out"
                  style={{ transform: `scale(${settings.componentScale})` }}
                >
                  <div
                    className="px-5 py-4 flex items-center justify-between border-b border-border"
                    style={{ backgroundColor: sat > 5 ? `${accent}0d` : undefined }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: accent }}
                      >
                        <Zap className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <div
                          className="font-black uppercase tracking-tight text-foreground"
                          style={{ fontSize: `${settings.fontSize - 2}px` }}
                        >
                          Module View
                        </div>
                        <div className="text-[10px] text-muted-foreground">Live data feed</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Live</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {[["Processing", "100%", 100], ["Memory", "42%", 42]].map(([name, pct, w]) => (
                      <div key={String(name)} className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          <span>{name}</span>
                          <span style={{ color: accent }}>{pct}</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${w}%`, backgroundColor: accent }} />
                        </div>
                      </div>
                    ))}
                    <div className="pt-1 grid grid-cols-2 gap-2">
                      <div className="h-8 rounded-lg bg-muted" />
                      <button
                        className="h-8 rounded-lg text-[11px] font-black text-white active:scale-95 transition-transform"
                        style={{ backgroundColor: accent }}
                      >
                        Action
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography */}
              <div className="p-5 rounded-2xl border border-border/60 bg-card/40 space-y-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Typography</div>
                <p className="font-black text-foreground leading-snug" style={{ fontSize: `${settings.fontSize + 6}px` }}>
                  Heading Sample
                </p>
                <p className="text-muted-foreground leading-relaxed" style={{ fontSize: `${settings.fontSize}px` }}>
                  This paragraph demonstrates your selected font size ({settings.fontSize}px). Density and spacing settings affect how content flows throughout the application.
                </p>
                <p
                  className="font-bold uppercase tracking-widest"
                  style={{ fontSize: `${settings.fontSize - 3}px`, color: accent }}
                >
                  Label text · {sat <= 5 ? "Neutral grayscale" : `${hue}° hue · ${sat}% sat`}
                </p>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default SettingsPage;