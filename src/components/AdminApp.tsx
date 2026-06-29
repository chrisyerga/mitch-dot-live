import { ConvexClientProvider } from "./ConvexClientProvider";
import { AdminLogin } from "./admin/AdminLogin";
import { AdminHoneypotPage } from "./admin/AdminHoneypotPage";
import { AdminShell } from "./admin/AdminShell";
import { AdminStatusPage } from "./admin/AdminStatusPage";
import { AdminNewsPage } from "./admin/AdminNewsPage";
import { AdminEditorialPage } from "./admin/AdminEditorialPage";
import { useAdminSession } from "../hooks/useAdminSession";
import type { AdminSection } from "../lib/adminSession";

export function AdminApp({ section }: { section: AdminSection }) {
  return (
    <ConvexClientProvider>
      <AdminAppInner section={section} />
    </ConvexClientProvider>
  );
}

function AdminAppInner({ section }: { section: AdminSection }) {
  const session = useAdminSession();

  if (session.honeypotTriggered) {
    return <AdminHoneypotPage />;
  }

  if (!session.token) {
    return (
      <AdminLogin
        error={session.error}
        busy={session.busy}
        onLogin={session.handleLogin}
      />
    );
  }

  return (
    <AdminShell
      section={section}
      error={session.error}
      onLogout={() => void session.handleLogout()}
    >
      {section === "status" && (
        <AdminStatusPage
          token={session.token}
          busy={session.busy}
          setBusy={session.setBusy}
          onError={session.setError}
        />
      )}
      {section === "news" && (
        <AdminNewsPage
          token={session.token}
          busy={session.busy}
          setBusy={session.setBusy}
          onError={session.setError}
        />
      )}
      {section === "editorial" && (
        <AdminEditorialPage token={session.token} onError={session.setError} />
      )}
    </AdminShell>
  );
}
