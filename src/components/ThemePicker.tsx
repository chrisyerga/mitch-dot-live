import {
  themePreferenceLabels,
  themePreferenceOrder,
  visualThemeLabels,
  type ThemePreference,
  type SiteTheme,
} from "../lib/themes";

type ThemePickerProps = {
  preference: ThemePreference;
  onChange: (preference: ThemePreference) => void;
  visualTheme: SiteTheme;
};

export function ThemePicker({ preference, onChange, visualTheme }: ThemePickerProps) {
  return (
    <div className="theme-picker mx-auto w-full max-w-xl">
      <p className="mb-3 font-mono text-[11px] tracking-[0.25em] text-[color:var(--muted)] uppercase">
        Theme · currently {visualThemeLabels[visualTheme]}
      </p>
      <div className="theme-picker-buttons flex flex-wrap justify-center gap-2">
        {themePreferenceOrder.map((option) => {
          const active = preference === option;
          const { label } = themePreferenceLabels[option];
          return (
            <button
              key={option}
              type="button"
              className={`theme-picker-btn rounded-full px-4 py-2 font-mono text-xs tracking-[0.15em] uppercase transition ${
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
      <p className="mt-3 text-sm text-[color:var(--muted)]">
        {themePreferenceLabels[preference].hint}
      </p>
    </div>
  );
}
