import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { formatParsedStatusAnswer } from "../../lib/pollDisplay";
import { formatCheckedAt } from "../../lib/format";

export function DataSourcesPanel({
  token,
  onError,
}: {
  token: string;
  onError: (message: string | null) => void;
}) {
  const dataSources = useQuery(api.dataSources.list);
  const setEnabled = useMutation(api.dataSources.setEnabled);
  const runNow = useMutation(api.dataSources.runNow);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [runningKey, setRunningKey] = useState<string | null>(null);

  const sortedSources = dataSources
    ? [...dataSources].sort((a, b) => b.confidence - a.confidence)
    : dataSources;

  const handleToggle = async (key: string, enabled: boolean) => {
    setTogglingKey(key);
    onError(null);
    try {
      await setEnabled({ token, key, enabled });
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to update data source");
    } finally {
      setTogglingKey(null);
    }
  };

  const handleRunNow = async (key: string) => {
    setRunningKey(key);
    onError(null);
    try {
      await runNow({ token, key });
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to run poll");
    } finally {
      setRunningKey(null);
    }
  };

  return (
    <section className="admin-card rounded-2xl p-6">
      <h2 className="font-display text-2xl">Data sources</h2>
      <p className="mt-2 opacity-80">
        Enable or disable automated polling. Disabled sources stay visible on the
        public homepage with their last result but are excluded from consensus
        scoring. Use Run now for a one-off poll (works even when disabled).
      </p>

      {sortedSources === undefined ? (
        <p className="mt-4 opacity-70">Loading data sources…</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] opacity-70">
                  Enabled
                </th>
                <th className="px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] opacity-70">
                  Source
                </th>
                <th className="px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] opacity-70">
                  Answer
                </th>
                <th className="px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] opacity-70">
                  Confidence
                </th>
                <th className="px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] opacity-70">
                  Last checked
                </th>
                <th className="px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] opacity-70">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedSources.map((source) => (
                <tr key={source.key} className="border-b border-white/10">
                  <td className="px-3 py-2 align-top">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={source.enabled}
                        disabled={togglingKey === source.key || runningKey === source.key}
                        onChange={(e) =>
                          void handleToggle(source.key, e.target.checked)
                        }
                      />
                      <span className="sr-only">
                        {source.enabled ? "Disable" : "Enable"} {source.name}
                      </span>
                    </label>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <p className="font-semibold">{source.name}</p>
                    <p className="mt-1 font-mono text-xs opacity-60">{source.key}</p>
                    {source.key === "x_trends" && (
                      <p className="mt-1 text-xs text-amber-200/80">
                        X search polling is costly (~$2/day at 15-minute intervals).
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {formatParsedStatusAnswer(source.currentStatus)}
                    {source.currentStatusDetail && (
                      <p className="mt-1 text-xs opacity-70">
                        {source.currentStatusDetail}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top">{source.confidence}</td>
                  <td className="px-3 py-2 align-top font-mono text-xs opacity-70">
                    {formatCheckedAt(source.lastCheckedAt)}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <button
                      type="button"
                      className="admin-btn rounded-lg px-3 py-1 text-sm"
                      disabled={runningKey === source.key || togglingKey === source.key}
                      onClick={() => void handleRunNow(source.key)}
                    >
                      {runningKey === source.key ? "Running…" : "Run now"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
