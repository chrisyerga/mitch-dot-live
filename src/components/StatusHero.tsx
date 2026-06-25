import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { SiteTheme } from "../lib/themes";
import type { StatusData } from "../lib/status";
import { latestDataSourceCheckAt } from "../lib/dataSources";
import { formatHeroDate } from "../lib/format";
import { DataSourcesTable } from "./DataSourcesTable";

function statusLine(
  isAlive: boolean,
  theme: SiteTheme,
  message: string | null | undefined,
): string {
  const custom = message?.trim();
  if (custom) return custom;
  if (!isAlive) return "He has passed away.";
  if (theme === "celebration") return "Alive, well, and accounted for.";
  return "Alive and in office.";
}

type StatusHeroProps = {
  theme: SiteTheme;
  status: StatusData;
};

export function StatusHero({ theme, status }: StatusHeroProps) {
  const sources = useQuery(api.dataSources.list);
  const isAlive = status?.isAlive ?? true;
  const answer = isAlive ? "YES" : "NO";
  const latestCheckedAt = latestDataSourceCheckAt(sources);
  const asOfLabel =
    latestCheckedAt != null ? formatHeroDate(latestCheckedAt) : "…";

  return (
    <section className="hero-section relative flex min-h-[84vh] flex-col items-center justify-center px-6 pt-10 pb-16 text-center">
      <div className="hero-section-backdrop pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {theme === "default" && (
          <>
            <div className="hero-default-grid absolute inset-0" />
            <div className="hero-default-glow absolute top-[-140px] left-1/2 h-[680px] w-[680px] -translate-x-1/2 rounded-full" />
          </>
        )}

        {theme === "celebration" && (
          <>
            <div className="hero-celebration-spin absolute top-[-90px] left-1/2 h-[540px] w-[540px] -translate-x-1/2 rounded-full" />
            <div className="hero-celebration-sun absolute top-[30px] left-1/2 h-[210px] w-[210px] -translate-x-1/2 rounded-full" />
            <div className="hero-celebration-rainbow absolute bottom-[-380px] left-1/2 h-[780px] w-[780px] -translate-x-1/2 rounded-full" />
          </>
        )}

        {theme === "memorial" && (
          <div className="hero-memorial-scene absolute top-4 left-1/2 max-w-[90vw] -translate-x-1/2">
            <div className="hero-memorial-clouds">
              <span className="hero-memorial-cloud-puff hero-memorial-cloud-puff-a" />
              <span className="hero-memorial-cloud-puff hero-memorial-cloud-puff-b" />
              <span className="hero-memorial-cloud-puff hero-memorial-cloud-puff-c" />
              <span className="hero-memorial-cloud-puff hero-memorial-cloud-puff-d" />
              <span className="hero-memorial-cloud-puff hero-memorial-cloud-puff-e" />
            </div>
          </div>
        )}
      </div>

      <div className="relative z-[5] flex w-full max-w-[720px] flex-col items-center gap-[18px]">
        <div className="hero-headline flex flex-col items-center">
          <h1 className="hero-page-title m-0 font-display font-extrabold tracking-[-0.02em] text-[color:var(--fg)]">
            Is Mitch McConnell Alive?
          </h1>
          <h2 className={`hero-answer m-0 ${isAlive ? "hero-answer-yes" : "hero-answer-no"}`}>
            {answer}
          </h2>
        </div>

        <div className="status-badge inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] px-[15px] py-[7px] text-xs font-semibold tracking-[0.09em] text-[color:var(--muted)] uppercase">
          <span className="site-header-dot h-2 w-2 shrink-0 rounded-full" aria-hidden="true" />
          Live status · as of {asOfLabel}
        </div>

        <p className="hero-status-line m-0 text-[clamp(20px,3vw,30px)] font-semibold text-[color:var(--fg)]">
          {statusLine(isAlive, theme, status?.message)}
        </p>

        <div className="mt-2 w-full">
          <p className="m-0 mb-3 text-center text-xs font-semibold tracking-[0.08em] text-[color:var(--muted)] uppercase">
            BASED ON THE FOLLOWING LIVE DATA:
          </p>
          <DataSourcesTable compact />
          {!isAlive && (
            <p className="m-0 mt-3 text-center text-sm text-[color:var(--muted)]">
              This page is preserved as a memorial.
            </p>
          )}
        </div>
      </div>

      <div className="scroll-hint absolute bottom-[22px] left-1/2 z-[5] -translate-x-1/2 text-[11px] tracking-[0.14em] text-[color:var(--muted)] uppercase">
        Scroll ↓
      </div>
    </section>
  );
}
