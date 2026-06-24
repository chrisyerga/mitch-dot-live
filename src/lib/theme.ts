export type ThemePreference = "neutral" | "happyNow" | "happyLater";
export type VisualTheme = "neutral" | "happy" | "sad";

export function resolveTheme(
  preference: ThemePreference,
  isAlive: boolean,
): "neutral" | "happy" | "sad" {
  if (preference === "neutral") {
    return "neutral";
  }

  if (preference === "happyNow") {
    return isAlive ? "happy" : "sad";
  }

  return isAlive ? "sad" : "happy";
}

export const THEME_PREFERENCE_KEY = "themePreference";

export const themePreferenceLabels: Record<
  ThemePreference,
  { label: string; hint: string }
> = {
  neutral: {
    label: "Neutral",
    hint: "Professional patriotic theme regardless of status.",
  },
  happyNow: {
    label: "Happy Now",
    hint: "Celebrate while he's alive; mourn when he's not.",
  },
  happyLater: {
    label: "Happy Later",
    hint: "Mourn prematurely; celebrate when the day comes.",
  },
};
