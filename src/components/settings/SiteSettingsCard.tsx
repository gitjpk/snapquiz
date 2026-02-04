"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useSiteSettings, Theme, AccentColor } from "@/components/providers/SiteSettingsProvider";
import { Locale } from "@/lib/i18n/translations";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCENT_COLORS: { value: AccentColor; color: string; hoverColor: string }[] = [
  { value: "blue", color: "bg-blue-500", hoverColor: "hover:ring-blue-500" },
  { value: "purple", color: "bg-purple-500", hoverColor: "hover:ring-purple-500" },
  { value: "green", color: "bg-green-500", hoverColor: "hover:ring-green-500" },
  { value: "orange", color: "bg-orange-500", hoverColor: "hover:ring-orange-500" },
  { value: "pink", color: "bg-pink-500", hoverColor: "hover:ring-pink-500" },
  { value: "red", color: "bg-red-500", hoverColor: "hover:ring-red-500" },
];

const LANGUAGES: { value: Locale; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
];

const THEMES: { value: Theme; icon: typeof Sun; labelKey: "lightMode" | "darkMode" | "systemTheme" }[] = [
  { value: "light", icon: Sun, labelKey: "lightMode" },
  { value: "dark", icon: Moon, labelKey: "darkMode" },
  { value: "system", icon: Monitor, labelKey: "systemTheme" },
];

export function SiteSettingsCard() {
  const { locale, setLocale, theme, setTheme, accentColor, setAccentColor, t } = useSiteSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.settings.siteSettings}</CardTitle>
        <CardDescription>{t.settings.siteSettingsDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Language Selection */}
        <div className="space-y-3">
          <Label>{t.settings.language}</Label>
          <p className="text-sm text-muted-foreground">{t.settings.languageDescription}</p>
          <div className="flex gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                onClick={() => setLocale(lang.value)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md border transition-all",
                  locale === lang.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input hover:border-primary/50 hover:bg-accent"
                )}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="font-medium">{lang.label}</span>
                {locale === lang.value && <Check className="h-4 w-4 ml-1" />}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Selection */}
        <div className="space-y-3">
          <Label>{t.settings.theme}</Label>
          <p className="text-sm text-muted-foreground">{t.settings.themeDescription}</p>
          <div className="flex gap-2">
            {THEMES.map((themeOption) => {
              const Icon = themeOption.icon;
              return (
                <button
                  key={themeOption.value}
                  onClick={() => setTheme(themeOption.value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md border transition-all",
                    theme === themeOption.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input hover:border-primary/50 hover:bg-accent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{t.settings[themeOption.labelKey]}</span>
                  {theme === themeOption.value && <Check className="h-4 w-4 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Color Selection */}
        <div className="space-y-3">
          <Label>{t.settings.accentColor}</Label>
          <p className="text-sm text-muted-foreground">{t.settings.accentColorDescription}</p>
          <div className="flex gap-3">
            {ACCENT_COLORS.map((colorOption) => (
              <button
                key={colorOption.value}
                onClick={() => setAccentColor(colorOption.value)}
                className={cn(
                  "w-10 h-10 rounded-lg transition-all ring-offset-2 ring-offset-background",
                  colorOption.color,
                  colorOption.hoverColor,
                  accentColor === colorOption.value
                    ? "ring-2 ring-current scale-105"
                    : "hover:ring-2 hover:scale-105"
                )}
                title={t.colors[colorOption.value]}
              >
                {accentColor === colorOption.value && (
                  <Check className="h-5 w-5 mx-auto text-white drop-shadow-md" />
                )}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
