import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
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
        <p className="m-0 mt-1 text-[12.5px] text-[color:var(--muted)]">
          <a href="/admin" className="text-[color:var(--accent2)] hover:underline">
            Admin
          </a>
        </p>
      </div>
    </footer>
  );
}

function SiteShellInner() {
  const status = useQuery(api.status.get);
  const isAlive = status?.isAlive ?? true;
  const { preference, setPreference, visualTheme } = useThemePreference(isAlive);

  return (
    <div className="site-root relative min-h-screen overflow-x-hidden bg-[color:var(--bg)] text-[color:var(--fg)]">
      <ThemeDecorations theme={visualTheme} />
      <div className="relative z-[1]">
        <SiteHeader />
        <StatusHero theme={visualTheme} />
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

export function SiteShell() {
  return (
    <ConvexClientProvider>
      <SiteShellInner />
    </ConvexClientProvider>
  );
}
