import {
  themePreferenceLabels,
  type ThemePreference,
  type VisualTheme,
} from "../lib/theme";

type ThemePickerProps = {
  preference: ThemePreference;
  onChange: (preference: ThemePreference) => void;
  visualTheme: VisualTheme;
};

const options: ThemePreference[] = ["neutral", "happyNow", "happyLater"];

export function ThemePicker({ preference, onChange, visualTheme }: ThemePickerProps) {
  return (
    <div className="theme-picker w-full max-w-xl">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] opacity-70">
        Theme · currently {visualTheme}
      </p>
      <div className="theme-picker-buttons flex flex-wrap justify-center gap-2">
        {options.map((option) => {
          const active = preference === option;
          const { label } = themePreferenceLabels[option];
          return (
            <button
              key={option}
              type="button"
              className={`theme-picker-btn rounded-full px-4 py-2 font-mono text-xs uppercase tracking-[0.15em] transition ${
                active ? "theme-picker-btn-active" : ""
              }`}
              aria-pressed={active}
              title={themePreferenceLabels[option].hint}
              onClick={() => onChange(option)}
            >
              {label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-sm opacity-75">{themePreferenceLabels[preference].hint}</p>
    </div>
  );
}
