import { useEffect, useState } from "react";
import { formatCheckedAt, formatRelativeCheckedAt } from "../lib/format";

type RelativeCheckedAtProps = {
  timestamp: number | null | undefined;
  fallback?: string;
};

export function RelativeCheckedAt({
  timestamp,
  fallback = "Never",
}: RelativeCheckedAtProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (timestamp == null) {
      return;
    }

    const ageMs = Date.now() - timestamp;
    const intervalMs =
      ageMs < 60_000 ? 1_000 : ageMs < 3_600_000 ? 30_000 : 60_000;
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [timestamp]);

  return (
    <span
      title={timestamp != null ? formatCheckedAt(timestamp) : undefined}
      suppressHydrationWarning
    >
      {timestamp != null ? formatRelativeCheckedAt(timestamp, now) : fallback}
    </span>
  );
}
