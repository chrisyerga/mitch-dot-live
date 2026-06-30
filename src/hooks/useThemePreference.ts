import { useEffect, useState } from "react";
import {
  readStoredPreference,
  resolveTheme,
  storePreference,
  type ThemePreference,
  type SiteTheme,
} from "../lib/themes";
import { loadThemeFonts } from "../lib/loadThemeFonts";

export function useThemePreference(isAlive: boolean) {
  const [preference, setPreferenceState] = useState<ThemePreference>("neutral");
  const visualTheme: SiteTheme = resolveTheme(preference, isAlive);

  useEffect(() => {
    setPreferenceState(readStoredPreference());
  }, []);

  useEffect(() => {
    document.documentElement.dataset.siteTheme = visualTheme;
    void loadThemeFonts(visualTheme);
  }, [visualTheme]);

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    storePreference(next);
  };

  return { preference, setPreference, visualTheme };
}
