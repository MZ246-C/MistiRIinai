import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";
import { AppSettings } from "@/lib/types";

interface AppearanceState {
  siteThemeColor: string;
  iconBgColor: string;
  iconLetterColor: string;
  applyLocally: (partial: Partial<Pick<AppSettings, "site_theme_color" | "icon_bg_color" | "icon_letter_color">>) => void;
}

const DEFAULTS = {
  siteThemeColor: "#402030",
  iconBgColor: "#311D28",
  iconLetterColor: "#B99040",
};

const AppearanceContext = createContext<AppearanceState | null>(null);

function applyAccentColor(hex: string) {
  document.documentElement.style.setProperty("--accent", hex);
}

function refreshFavicon() {
  const href = `/api/icon-svg?ts=${Date.now()}`;
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/svg+xml";
  link.href = href;
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(DEFAULTS);

  useEffect(() => {
    applyAccentColor(state.siteThemeColor);
  }, [state.siteThemeColor]);

  useEffect(() => {
    api
      .get<{ settings: AppSettings }>("/settings-get")
      .then((res) => {
        setState({
          siteThemeColor: res.settings.site_theme_color || DEFAULTS.siteThemeColor,
          iconBgColor: res.settings.icon_bg_color || DEFAULTS.iconBgColor,
          iconLetterColor: res.settings.icon_letter_color || DEFAULTS.iconLetterColor,
        });
        refreshFavicon();
      })
      .catch(() => {});
  }, []);

  const applyLocally = useCallback(
    (partial: Partial<Pick<AppSettings, "site_theme_color" | "icon_bg_color" | "icon_letter_color">>) => {
      setState((prev) => ({
        siteThemeColor: partial.site_theme_color ?? prev.siteThemeColor,
        iconBgColor: partial.icon_bg_color ?? prev.iconBgColor,
        iconLetterColor: partial.icon_letter_color ?? prev.iconLetterColor,
      }));
      refreshFavicon();
    },
    []
  );

  return (
    <AppearanceContext.Provider
      value={{
        siteThemeColor: state.siteThemeColor,
        iconBgColor: state.iconBgColor,
        iconLetterColor: state.iconLetterColor,
        applyLocally,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance must be used within AppearanceProvider");
  return ctx;
}