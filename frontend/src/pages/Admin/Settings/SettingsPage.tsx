import React from "react";
import { useSystemSettings } from "@/context/SystemSettingsContext";
import {
  Sun,
  Moon,
  Monitor,
  Type,
  Palette,
  RotateCcw,
  Layout,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSystemSettings();

  const appearanceModes = [
    { id: "light", icon: Sun, label: "Light", desc: "Clean and bright" },
    { id: "dark", icon: Moon, label: "Dark", desc: "Easy on the eyes" },
    { id: "system", icon: Monitor, label: "System", desc: "Auto-adaptive" },
  ] as const;

  return (
    <div className="mx-auto p-6 lg:p-10 space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border pb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground max-w-lg">
            Manage your workspace preferences, interface scale, and visual identity.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetSettings}
          className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </Button>
      </div>

      <div className="space-y-10">
        {/* Atmosphere Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Appearance</h3>
            <p className="text-xs text-muted-foreground/80">Choose how the application looks for you.</p>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {appearanceModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => updateSettings({ themeMode: mode.id as any })}
                className={cn(
                  "flex flex-col items-start gap-4 p-5 rounded-2xl border transition-all duration-300 group relative overflow-hidden",
                  settings.themeMode === mode.id
                    ? "border-primary bg-primary/[0.03] shadow-lg shadow-primary/5 ring-1 ring-primary/20"
                    : "border-border/60 hover:border-primary/30 bg-card hover:bg-muted/50 hover:shadow-md"
                )}
              >
                <div className={cn(
                  "p-2 rounded-md transition-colors",
                  settings.themeMode === mode.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:text-foreground"
                )}>
                  <mode.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{mode.label}</div>
                  <div className="text-[11px] text-muted-foreground">{mode.desc}</div>
                </div>
                {settings.themeMode === mode.id && (
                  <div className="absolute top-3 right-3 animate-in fade-in zoom-in duration-300">
                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        <hr className="border-border/60" />

        {/* Visual Identity Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Brand Identity</h3>
            <p className="text-xs text-muted-foreground/80">Customize the primary accent color of your interface.</p>
          </div>
          <Card className="md:col-span-2 border-border/80 shadow-sm rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-colors duration-300">
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center gap-6">
                <div className="relative group shrink-0">
                  <input
                    type="color"
                    value={`hsl(${settings.themeHue}, 70%, 50%)`}
                    onChange={() => { }} // Controlled by slider
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled
                  />
                  <div
                    className="w-20 h-20 rounded-lg shadow-inner ring-1 ring-border"
                    style={{ backgroundColor: `hsl(${settings.themeHue}, 70%, 50%)` }}
                  />
                  <div className="absolute -bottom-1 -right-1 bg-background p-1.5 rounded-md shadow-md border border-border">
                    <Palette className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Theme Hue</div>
                  <div className="text-3xl font-bold tabular-nums text-foreground">{settings.themeHue}°</div>
                  <p className="text-[11px] text-muted-foreground">Slide to adjust the spectrum of your interface accents.</p>
                </div>
              </div>

              <div className="space-y-4">
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={settings.themeHue}
                  onChange={(e) => updateSettings({ themeHue: parseInt(e.target.value) })}
                  className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                  <span>Spectrum Start</span>
                  <span>Spectrum End</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <hr className="border-border/60" />

        {/* Geometry Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Geometry</h3>
            <p className="text-xs text-muted-foreground/80">Adjust text size and structural density.</p>
          </div>
          <div className="md:col-span-2 space-y-4">
            <Card className="border-border/80 shadow-sm rounded-2xl bg-card/50 hover:border-primary/20 transition-all duration-300 group/card">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover/card:scale-110 transition-transform">
                      <Type className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-sm font-bold uppercase tracking-tight">Base Font Size</span>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Default text scale for the entire system.</p>
                    </div>
                  </div>
                  <span className="text-xs font-black bg-muted px-3 py-1.5 rounded-lg text-foreground border border-border/50">{settings.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="20"
                  value={settings.fontSize}
                  onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                />
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-sm rounded-2xl bg-card/50 hover:border-primary/20 transition-all duration-300 group/card">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover/card:scale-110 transition-transform">
                      <Layout className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-sm font-bold uppercase tracking-tight">Interface Density</span>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Scale components inwards or outwards.</p>
                    </div>
                  </div>
                  <span className="text-xs font-black bg-muted px-3 py-1.5 rounded-lg text-foreground border border-border/50">
                    {(settings.componentScale * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.05"
                  value={settings.componentScale}
                  onChange={(e) => updateSettings({ componentScale: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                />
              </CardContent>
            </Card>
          </div>
        </section>

        <hr className="border-border/60" />

        {/* Preview Section */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Live Preview</h3>
            <p className="text-xs text-muted-foreground/80">See how your changes affect the core UI components.</p>
          </div>

          <Card className="border-border bg-card shadow-lg rounded-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[400px]">
                {/* Left side: Controls */}
                <div className="lg:col-span-2 p-8 space-y-8 border-r border-border/60 bg-muted/30">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold tracking-tight text-foreground" style={{ fontSize: `${settings.fontSize + 2}px` }}>
                      Component Lab
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontSize: `${settings.fontSize}px` }}>
                      This sandbox demonstrates how semantic scaling and dynamic hue mapping interact within the application framework.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button className="w-full rounded-md shadow-sm font-semibold">Primary Action</Button>
                    <Button variant="outline" className="w-full rounded-md font-semibold bg-background border-border/60">Secondary View</Button>
                  </div>

                  <div className="pt-4 grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-border bg-background flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Scale</span>
                      <span className="text-lg font-bold">{(settings.componentScale).toFixed(2)}x</span>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-background flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hue</span>
                      <span className="text-lg font-bold">{settings.themeHue}°</span>
                    </div>
                  </div>
                </div>

                {/* Right side: Visual Preview */}
                <div className="lg:col-span-3 p-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] opacity-40" />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

                  <div
                    className="w-full max-w-sm bg-background border border-border p-6 rounded-lg shadow-2xl space-y-6 transition-transform duration-300 ease-out z-10"
                    style={{ transform: `scale(${settings.componentScale})` }}
                  >
                    <div className="flex items-center justify-between pb-4 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-foreground">Module View</span>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                          <span>Processing Layer</span>
                          <span>Complete</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-full" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                          <span>Memory Allocation</span>
                          <span>42%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-[42%]" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex gap-2">
                      <div className="h-8 flex-1 bg-muted rounded-md" />
                      <div className="h-8 w-12 bg-primary rounded-md" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};


export default SettingsPage;