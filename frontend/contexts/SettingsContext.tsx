"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

const STORAGE_KEY = "youtube2rpg_settings";

export interface Settings {
  musicEnabled: boolean;
  musicVolume: number; // 0-1
  sfxEnabled: boolean;
  sfxVolume: number; // 0-1
}

const DEFAULT_SETTINGS: Settings = {
  musicEnabled: true,
  musicVolume: 0.5,
  sfxEnabled: true,
  sfxVolume: 0.5,
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  resetSettings: () => void;
  toggleMusic: () => void;
  toggleSfx: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new settings being added
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error("Error saving settings:", error);
      }
    }
  }, [settings, isLoaded]);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const toggleMusic = useCallback(() => {
    setSettings((prev) => ({ ...prev, musicEnabled: !prev.musicEnabled }));
  }, []);

  const toggleSfx = useCallback(() => {
    setSettings((prev) => ({ ...prev, sfxEnabled: !prev.sfxEnabled }));
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        toggleMusic,
        toggleSfx,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

// Hook for components that may be outside the provider (returns defaults)
export function useSettingsSafe(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    // Return a mock context with defaults
    return {
      settings: DEFAULT_SETTINGS,
      updateSettings: () => {},
      resetSettings: () => {},
      toggleMusic: () => {},
      toggleSfx: () => {},
    };
  }
  return context;
}
