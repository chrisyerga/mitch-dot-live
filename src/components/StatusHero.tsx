import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useThemePreference } from "../hooks/useThemePreference";
import { ThemePicker } from "./ThemePicker";

function formatUpdatedAt(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date(timestamp));
}

export function StatusHero() {
  const status = useQuery(api.status.get);
  const isAlive = status?.isAlive ?? true;
  const { preference, setPreference, visualTheme } = useThemePreference(isAlive);

  const label = status === undefined ? "…" : isAlive ? "YES" : "NO";
  const sublabel =
    status === undefined
      ? "Checking status…"
      : isAlive
        ? "Addison Mitchell McConnell III is alive."
        : "Addison Mitchell McConnell III is not alive.";

  return (
    <section className="hero-section relative overflow-hidden px-6 py-20 md:py-28">
      <div className="hero-decor pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-8 text-center">
        <p className="hero-eyebrow font-mono text-xs uppercase tracking-[0.35em]">
          Is Mitch McConnell still alive?
        </p>
        <h1
          className={`hero-status font-display text-[clamp(5rem,22vw,12rem)] leading-none font-bold tracking-tight ${
            isAlive ? "hero-status-yes" : "hero-status-no"
          }`}
        >
          {label}
        </h1>
        <p className="hero-subtitle max-w-2xl text-lg md:text-xl">{sublabel}</p>
        {status && (
          <p className="hero-meta font-mono text-xs uppercase tracking-[0.2em] opacity-70">
            Last updated {formatUpdatedAt(status.updatedAt)} ET
            {status.note ? ` · ${status.note}` : ""}
          </p>
        )}
        <ThemePicker
          preference={preference}
          onChange={setPreference}
          visualTheme={visualTheme}
        />
      </div>
    </section>
  );
}
