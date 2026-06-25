export type SiteTheme = "default" | "celebration" | "memorial";

export type ThemePreference = "neutral" | "happyNow" | "happyLater";

export const THEME_PREFERENCE_KEY = "themePreference";

export const themePreferenceLabels: Record<
  ThemePreference,
  { label: string; hint: string }
> = {
  neutral: {
    label: "Neutral",
    hint: "Simple factual theme regardless of status.",
  },
  happyNow: {
    label: "Happy Now",
    hint: "Celebrate his life; mourn his death.",
  },
  happyLater: {
    label: "Happy Later",
    hint: "Mourn now; celebrate when he passes.",
  },
};

export const themePreferenceOrder: ThemePreference[] = [
  "neutral",
  "happyNow",
  "happyLater",
];

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === "neutral" || value === "happyNow" || value === "happyLater";
}

export function resolveTheme(
  preference: ThemePreference,
  isAlive: boolean,
): SiteTheme {
  if (preference === "neutral") return "default";
  if (preference === "happyNow") return isAlive ? "celebration" : "memorial";
  return isAlive ? "memorial" : "celebration";
}

export function readStoredPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(THEME_PREFERENCE_KEY);
    if (isThemePreference(saved)) return saved;
    // migrate old mockup picker value
    const legacy = localStorage.getItem("mmstatus-theme");
    if (legacy === "celebration") return "happyNow";
    if (legacy === "memorial") return "happyLater";
  } catch {
    /* ignore */
  }
  return "neutral";
}

export function storePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_PREFERENCE_KEY, preference);
  } catch {
    /* ignore */
  }
}

export const visualThemeLabels: Record<SiteTheme, string> = {
  default: "neutral",
  celebration: "happy",
  memorial: "sad",
};
