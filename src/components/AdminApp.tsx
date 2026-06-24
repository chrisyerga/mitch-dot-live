import { ConvexClientProvider } from "./ConvexClientProvider";
import { AdminPanel } from "./AdminPanel";

export function AdminApp() {
  return (
    <ConvexClientProvider>
      <AdminPanel />
    </ConvexClientProvider>
  );
}
