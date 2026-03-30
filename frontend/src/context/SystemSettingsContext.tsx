import React, { createContext, useContext, useEffect, useState } from "react";

interface SystemSettings {
  fontSize: number;
  themeHue: number;
  themeSat: number;
  themeLight: number;
  themeMode: "light" | "dark" | "system";
  componentScale: number;
}

interface SystemSettingsContextType {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: SystemSettings = {
  fontSize: 16,
  themeHue: 240, // Indigo/Zinc default range
  themeSat: 70,
  themeLight: 50,
  themeMode: "light",
  componentScale: 1,
};

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

export const SystemSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem("system_settings");
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("system_settings", JSON.stringify(updated));
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem("system_settings");
  };

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Handle Dark Mode
    const effectiveMode = settings.themeMode === "system" 
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : settings.themeMode;

    if (effectiveMode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Inject CSS Variables
    root.style.setProperty("--system-font-size", `${settings.fontSize}px`);
    root.style.setProperty("--system-hue", `${settings.themeHue}`);
    root.style.setProperty("--system-sat", `${settings.themeSat ?? 70}%`);
    root.style.setProperty("--system-light", `${settings.themeLight ?? 50}%`);
    root.style.setProperty("--system-scale", `${settings.componentScale}`);
    
    // Scale root font size
    root.style.fontSize = `${(settings.fontSize / 16) * 100}%`;
    
  }, [settings]);

  return (
    <SystemSettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error("useSystemSettings must be used within a SystemSettingsProvider");
  }
  return context;
};
