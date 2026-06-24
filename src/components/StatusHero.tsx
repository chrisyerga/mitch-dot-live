import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { SiteTheme } from "../lib/themes";
import type { ThemePreference } from "../lib/themes";
import { ThemePicker } from "./ThemePicker";

function formatAsOf(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(new Date(timestamp));
}

function formatVerified(isAlive: boolean, timestamp: number): string {
  const asOf = formatAsOf(timestamp);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(new Date(timestamp));

  if (!isAlive) {
    return `Reported ${asOf}, ${time} ET · Source: Associated Press. This page is preserved as a memorial.`;
  }
  return `Last verified ${asOf}, ${time} ET · Source: Associated Press. Checked continuously against current reporting.`;
}

function statusLine(isAlive: boolean, theme: SiteTheme): string {
  if (!isAlive) return "He has passed away.";
  if (theme === "celebration") return "Alive, well, and accounted for.";
  return "Alive and in office.";
}

type StatusHeroProps = {
  theme: SiteTheme;
  preference: ThemePreference;
  onPreferenceChange: (preference: ThemePreference) => void;
};

export function StatusHero({ theme, preference, onPreferenceChange }: StatusHeroProps) {
  const status = useQuery(api.status.get);
  const isAlive = status?.isAlive ?? true;
  const answer = status === undefined ? "…" : isAlive ? "YES" : "NO";

  return (
    <section className="hero-section relative flex min-h-[84vh] flex-col items-center justify-center overflow-hidden px-6 pt-[70px] pb-16 text-center">
      {theme === "default" && (
        <>
          <div className="hero-default-grid pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="hero-default-glow pointer-events-none absolute top-[-140px] left-1/2 h-[680px] w-[680px] -translate-x-1/2 rounded-full" aria-hidden="true" />
        </>
      )}

      {theme === "celebration" && (
        <>
          <div className="hero-celebration-spin pointer-events-none absolute top-[-90px] left-1/2 h-[540px] w-[540px] -translate-x-1/2 rounded-full" aria-hidden="true" />
          <div className="hero-celebration-sun pointer-events-none absolute top-[30px] left-1/2 h-[210px] w-[210px] -translate-x-1/2 rounded-full" aria-hidden="true" />
          <div className="hero-celebration-rainbow pointer-events-none absolute bottom-[-380px] left-1/2 h-[780px] w-[780px] -translate-x-1/2 rounded-full" aria-hidden="true" />
        </>
      )}

      {theme === "memorial" && (
        <div className="hero-memorial-scene pointer-events-none absolute top-4 left-1/2 z-0 max-w-[90vw] -translate-x-1/2" aria-hidden="true">
          <div className="hero-memorial-clouds">
            <span className="hero-memorial-cloud-puff hero-memorial-cloud-puff-a" />
            <span className="hero-memorial-cloud-puff hero-memorial-cloud-puff-b" />
            <span className="hero-memorial-cloud-puff hero-memorial-cloud-puff-c" />
            <span className="hero-memorial-cloud-puff hero-memorial-cloud-puff-d" />
            <span className="hero-memorial-cloud-puff hero-memorial-cloud-puff-e" />
          </div>
        </div>
      )}

      <div className="relative z-[5] flex flex-col items-center gap-[18px]">
        <div className="status-badge inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] px-[15px] py-[7px] text-xs font-semibold tracking-[0.09em] text-[color:var(--muted)] uppercase">
          <span className="site-header-dot h-2 w-2 shrink-0 rounded-full" aria-hidden="true" />
          Live status · as of {status ? formatAsOf(status.updatedAt) : "…"}
        </div>

        <h1 className={`hero-answer m-0 ${isAlive ? "hero-answer-yes" : "hero-answer-no"}`}>
          {answer}
        </h1>

        <p className="hero-status-line m-0 text-[clamp(20px,3vw,30px)] font-semibold text-[color:var(--fg)]">
          {status === undefined ? "Checking status…" : statusLine(isAlive, theme)}
        </p>

        {status && (
          <p className="hero-verified m-0 mt-1 max-w-[540px] text-sm leading-normal text-[color:var(--muted)]">
            {formatVerified(isAlive, status.updatedAt)}
          </p>
        )}

        <ThemePicker
          preference={preference}
          onChange={onPreferenceChange}
          visualTheme={theme}
        />
      </div>

      <div className="scroll-hint absolute bottom-[22px] left-1/2 z-[5] -translate-x-1/2 text-[11px] tracking-[0.14em] text-[color:var(--muted)] uppercase">
        Scroll ↓
      </div>
    </section>
  );
}
