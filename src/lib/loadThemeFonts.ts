import type { SiteTheme } from "./themes";

const loaded = new Set<SiteTheme>();

/** Load self-hosted theme fonts without blocking first paint on the default theme. */
export async function loadThemeFonts(theme: SiteTheme): Promise<void> {
  if (theme === "default" || loaded.has(theme)) return;

  loaded.add(theme);
  if (theme === "celebration") {
    await import("../styles/fonts/celebration.css");
  } else {
    await import("../styles/fonts/memorial.css");
  }
}
