import { SiteLogo } from "./SiteLogo";

export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-50 border-b border-[color:var(--line)] bg-[color-mix(in_srgb,var(--surface)_78%,transparent)] backdrop-blur-[10px]">
      <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-6 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="site-header-dot shrink-0 rounded-full" aria-hidden="true" />
          <SiteLogo />
        </div>
      </div>
    </header>
  );
}
