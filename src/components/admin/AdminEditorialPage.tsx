import { EditorialPanel } from "../EditorialPanel";

export function AdminEditorialPage({
  token,
  onError,
}: {
  token: string;
  onError: (message: string | null) => void;
}) {
  return (
    <div className="space-y-8">
      <EditorialPanel token={token} onError={onError} />
    </div>
  );
}
