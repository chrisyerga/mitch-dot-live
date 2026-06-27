import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { StatusData } from "../lib/status";
import { captureEvent } from "../lib/analytics";
import { FAVICON_STATUS_EVENT } from "../lib/animatedFavicon";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ThemeDecorations } from "./ThemeDecorations";
import { SiteHeader } from "./SiteHeader";
import { StatusHero } from "./StatusHero";
import { ThemePickerIsland } from "./ThemePickerIsland";
import { StatsSection } from "./StatsSection";
import { NewsSection } from "./NewsSection";
import { BioSection } from "./BioSection";
import { TimelineSection } from "./TimelineSection";
import { FaqSection } from "./FaqSection";
import { NotifySection } from "./NotifySection";
import { useThemePreference } from "../hooks/useThemePreference";

function SiteFooter() {
  return (
    <footer className="site-footer border-t border-[color:var(--line)]">
      <div className="mx-auto flex max-w-[1180px] flex-col items-center gap-2 px-6 py-8 pb-12 text-center">
        <span className="font-display text-[13px] font-bold tracking-[0.05em] text-[color:var(--fg)] uppercase">
          Is Mitch McConnell Alive?
        </span>
        <p className="m-0 max-w-[560px] text-[12.5px] leading-normal text-[color:var(--muted)]">
          Independent, non-partisan status tracker. Not affiliated with Senator McConnell,
          his office, or any campaign or party.
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12.5px] text-[color:var(--muted)]">
          <span>
            Built by{" "}
            <a
              href="https://lindale.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[color:var(--accent2)] hover:underline"
            >
              Lindale Labs, LLC
            </a>
          </span>
          Fork it or build your own:
          <a
            href="https://github.com/chrisyerga/mitch-dot-live"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[color:var(--accent2)] hover:underline"
          >
            <svg
              viewBox="0 0 16 16"
              aria-hidden="true"
              className="h-4 w-4 fill-current"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub
          </a>
        </div>
        <p className="m-0 mt-1 text-[12.5px] text-[color:var(--muted)]">
          <a href="/admin" className="text-[color:var(--accent2)] hover:underline">
            Admin
          </a>
        </p>
      </div>
    </footer>
  );
}

function SiteShellInner({ initialStatus }: { initialStatus: StatusData }) {
  const live = useQuery(api.status.get);
  const status = live ?? initialStatus;
  const isAlive = status?.isAlive ?? true;
  const { preference, setPreference, visualTheme } = useThemePreference(isAlive);

  useEffect(() => {
    if (status) {
      captureEvent("status_viewed", { isAlive: status.isAlive });
      window.dispatchEvent(
        new CustomEvent(FAVICON_STATUS_EVENT, {
          detail: { isAlive: status.isAlive },
        }),
      );
    }
  }, [status?.isAlive]);

  return (
    <div className="site-root relative min-h-screen overflow-x-hidden bg-[color:var(--bg)] text-[color:var(--fg)]">
      <ThemeDecorations theme={visualTheme} />
      <div className="relative z-[1]">
        <SiteHeader />
        <StatusHero theme={visualTheme} status={status} />
        <ThemePickerIsland
          preference={preference}
          onChange={setPreference}
          visualTheme={visualTheme}
        />
        <StatsSection />
        <NewsSection />
        <BioSection />
        <TimelineSection />
        <FaqSection />
        <SiteFooter />
      </div>
    </div>
  );
}

export function SiteShell({
  initialStatus = null,
}: {
  initialStatus?: StatusData;
}) {
  return (
    <ConvexClientProvider>
      <SiteShellInner initialStatus={initialStatus} />
    </ConvexClientProvider>
  );
}
