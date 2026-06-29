export const ADMIN_SESSION_KEY = "adminSessionToken";

export function getStoredAdminToken(): string | null {
  return localStorage.getItem(ADMIN_SESSION_KEY);
}

export function setStoredAdminToken(token: string): void {
  localStorage.setItem(ADMIN_SESSION_KEY, token);
}

export function clearStoredAdminToken(): void {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

export type AdminSection = "status" | "news" | "editorial";

export const ADMIN_SECTIONS: Array<{ id: AdminSection; label: string; href: string }> = [
  { id: "status", label: "Status", href: "/admin/status/" },
  { id: "news", label: "News", href: "/admin/news/" },
  { id: "editorial", label: "Editorial", href: "/admin/editorial/" },
];
