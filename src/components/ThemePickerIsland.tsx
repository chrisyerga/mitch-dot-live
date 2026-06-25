import {
  themePreferenceLabels,
  themePreferenceOrder,
  visualThemeLabels,
  type ThemePreference,
  type SiteTheme,
} from "../lib/themes";

type ThemePickerIslandProps = {
  preference: ThemePreference;
  onChange: (preference: ThemePreference) => void;
  visualTheme: SiteTheme;
};

export function ThemePickerIsland({
  preference,
  onChange,
  visualTheme,
}: ThemePickerIslandProps) {
  return (
    <section
      className="theme-picker-island-section relative z-10 mx-auto max-w-[1180px] px-6 pt-2 pb-10"
      aria-labelledby="disposition-heading"
    >
      <div className="theme-picker-island mx-auto max-w-[720px] overflow-hidden">
        <div
          id="disposition-heading"
          className="theme-picker-island-banner font-display text-center font-extrabold tracking-[0.14em] uppercase"
        >
          Your disposition
        </div>

        <div className="theme-picker-island-body">
          <p className="theme-picker-current m-0 font-mono text-[11px] tracking-[0.22em] text-[color:var(--muted)] uppercase">
            Theme · currently {visualThemeLabels[visualTheme]}
          </p>

          <div className="theme-picker-buttons mt-5 flex flex-wrap justify-center gap-3">
            {themePreferenceOrder.map((option) => {
              const active = preference === option;
              const { label } = themePreferenceLabels[option];
              return (
                <button
                  key={option}
                  type="button"
                  className={`theme-picker-btn font-display rounded-full font-bold tracking-[0.06em] uppercase transition ${
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

          <p className="theme-picker-hint m-0 mt-5 text-[clamp(14px,2vw,16px)] leading-relaxed text-[color:var(--muted)]">
            {themePreferenceLabels[preference].hint}
          </p>
        </div>
      </div>
    </section>
  );
}
