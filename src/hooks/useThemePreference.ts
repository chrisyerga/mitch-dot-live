import { useEffect, useState } from "react";
import {
  THEME_PREFERENCE_KEY,
  type ThemePreference,
  resolveTheme,
} from "../lib/theme";

export function useThemePreference(isAlive: boolean) {
  const [preference, setPreferenceState] = useState<ThemePreference>("neutral");

  useEffect(() => {
    const stored = localStorage.getItem(THEME_PREFERENCE_KEY);
    if (
      stored === "neutral" ||
      stored === "happyNow" ||
      stored === "happyLater"
    ) {
      setPreferenceState(stored);
    }
  }, []);

  const visualTheme = resolveTheme(preference, isAlive);

  useEffect(() => {
    document.documentElement.dataset.theme = visualTheme;
  }, [visualTheme]);

  const setPreference = (next: ThemePreference) => {
    localStorage.setItem(THEME_PREFERENCE_KEY, next);
    setPreferenceState(next);
  };

  return { preference, setPreference, visualTheme };
}
