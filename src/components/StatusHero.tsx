import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { SiteTheme } from "../lib/themes";
import type { StatusData } from "../lib/status";
import { latestDataSourceCheckAt } from "../lib/dataSources";
import { RelativeCheckedAt } from "./RelativeCheckedAt";
import {
  analyzeSourceConsensusBreakdown,
  DEV_PREVIEW_MAYBE_EVENT,
  isDevPreviewMaybeEnabled,
  maybeStatusLine,
} from "../lib/sourceConsensus";
import { DataSourcesTable } from "./DataSourcesTable";
import { MaybeHeadlines } from "./MaybeHeadlines";

function statusLine(
  isAlive: boolean,
  theme: SiteTheme,
  message: string | null | undefined,
  deceasedSourceName: string | null,
): string {
  if (deceasedSourceName) {
    return maybeStatusLine(deceasedSourceName);
  }

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
  const [previewMaybe, setPreviewMaybe] = useState(false);

  useEffect(() => {
    const syncPreview = () => setPreviewMaybe(isDevPreviewMaybeEnabled());
    syncPreview();
    window.addEventListener(DEV_PREVIEW_MAYBE_EVENT, syncPreview);
    return () => window.removeEventListener(DEV_PREVIEW_MAYBE_EVENT, syncPreview);
  }, []);

  const isAlive = status?.isAlive ?? true;
  const breakdown = analyzeSourceConsensusBreakdown(sources, {
    isAlive,
    previewMaybe,
  });
  const showMaybe = breakdown.heroAnswer === "MAYBE";
  const answer = breakdown.heroAnswer;
  const answerClass = showMaybe
    ? "hero-answer-maybe"
    : isAlive
      ? "hero-answer-yes"
      : "hero-answer-no";
  const latestCheckedAt = latestDataSourceCheckAt(sources);
  const line =
    breakdown.statusLine ??
    statusLine(isAlive, theme, status?.message, null);

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
          <h2 className={`hero-answer m-0 ${answerClass}`}>{answer}</h2>
        </div>

        <div className="status-badge inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] px-[15px] py-[7px] text-xs font-semibold tracking-[0.09em] text-[color:var(--muted)] uppercase">
          <span className="site-header-dot h-2 w-2 shrink-0 rounded-full" aria-hidden="true" />
          Live status. Last checked:{" "}
          <RelativeCheckedAt timestamp={latestCheckedAt} fallback="…" />
        </div>

        <p className="hero-status-line m-0 max-w-[640px] text-[clamp(18px,2.8vw,28px)] leading-snug font-semibold text-[color:var(--fg)]">
          {line}
        </p>

        {showMaybe && <MaybeHeadlines />}

        <div className="mt-2 w-full">
          <p className="m-0 mb-3 text-center text-xs font-semibold tracking-[0.08em] text-[color:var(--muted)] uppercase">
            BASED ON THE FOLLOWING LIVE DATA:
          </p>
          <DataSourcesTable compact showDeceasedDetails={showMaybe} />
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
