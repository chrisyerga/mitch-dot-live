import type { ReactNode } from "react";
import { ADMIN_SECTIONS, type AdminSection } from "../../lib/adminSession";

export function AdminShell({
  section,
  error,
  onLogout,
  children,
}: {
  section: AdminSection;
  error: string | null;
  onLogout: () => void;
  children: ReactNode;
}) {
  const active = ADMIN_SECTIONS.find((item) => item.id === section);

  return (
    <div className="admin-shell min-h-screen">
      <header className="admin-topbar sticky top-0 z-50 border-b border-white/10 bg-[#12141a]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="font-display text-2xl">Admin</h1>
            {active && <p className="mt-0.5 text-sm opacity-70">{active.label}</p>}
          </div>
          <button type="button" onClick={onLogout} className="admin-btn rounded-lg px-4 py-2">
            Sign out
          </button>
        </div>
        <nav
          className="admin-nav mx-auto flex max-w-4xl gap-1 px-6 pb-0"
          aria-label="Admin sections"
        >
          {ADMIN_SECTIONS.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`admin-nav-link ${section === item.id ? "admin-nav-link-active" : ""}`}
              aria-current={section === item.id ? "page" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        {error && <p className="mb-6 text-sm text-red-400">{error}</p>}
        {children}
      </div>
    </div>
  );
}
