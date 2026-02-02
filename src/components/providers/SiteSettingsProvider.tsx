"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Locale, TranslationKeys, getTranslations } from "@/lib/i18n/translations";

export type Theme = "light" | "dark" | "system";
export type AccentColor = "blue" | "purple" | "green" | "orange" | "pink" | "red";

interface SiteSettings {
  locale: Locale;
  theme: Theme;
  accentColor: AccentColor;
}

interface SiteSettingsContextType extends SiteSettings {
  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
  t: TranslationKeys;
  isLoaded: boolean;
}

const DEFAULT_SETTINGS: SiteSettings = {
  locale: "en",
  theme: "system",
  accentColor: "blue",
};

const STORAGE_KEY = "snapquiz-site-settings";

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  
  const effectiveTheme = theme === "system" ? getSystemTheme() : theme;
  const root = document.documentElement;
  
  if (effectiveTheme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function applyAccentColor(color: AccentColor) {
  if (typeof document === "undefined") return;
  
  const root = document.documentElement;
  
  // Remove all accent color classes
  root.classList.remove(
    "accent-blue",
    "accent-purple",
    "accent-green",
    "accent-orange",
    "accent-pink",
    "accent-red"
  );
  
  // Add the new accent color class
  root.classList.add(`accent-${color}`);
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<SiteSettings>;
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error("Failed to load site settings:", error);
    }
    setIsLoaded(true);
  }, []);

  // Apply theme and accent color when settings change
  useEffect(() => {
    if (!isLoaded) return;
    applyTheme(settings.theme);
    applyAccentColor(settings.accentColor);
  }, [settings.theme, settings.accentColor, isLoaded]);

  // Listen for system theme changes
  useEffect(() => {
    if (settings.theme !== "system") return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [settings.theme]);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: SiteSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Failed to save site settings:", error);
    }
  }, []);

  const setLocale = useCallback((locale: Locale) => {
    setSettings((prev) => {
      const newSettings = { ...prev, locale };
      saveSettings(newSettings);
      return newSettings;
    });
  }, [saveSettings]);

  const setTheme = useCallback((theme: Theme) => {
    setSettings((prev) => {
      const newSettings = { ...prev, theme };
      saveSettings(newSettings);
      return newSettings;
    });
  }, [saveSettings]);

  const setAccentColor = useCallback((accentColor: AccentColor) => {
    setSettings((prev) => {
      const newSettings = { ...prev, accentColor };
      saveSettings(newSettings);
      return newSettings;
    });
  }, [saveSettings]);

  // Get the translations for the current locale
  const t = getTranslations(settings.locale);

  return (
    <SiteSettingsContext.Provider
      value={{
        ...settings,
        setLocale,
        setTheme,
        setAccentColor,
        t,
        isLoaded,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error("useSiteSettings must be used within a SiteSettingsProvider");
  }
  return context;
}

// Hook for just translations (convenience)
export function useTranslations() {
  const { t, locale } = useSiteSettings();
  return { t, locale };
}
