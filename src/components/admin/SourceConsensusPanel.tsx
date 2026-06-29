import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import {
  analyzeSourceConsensusBreakdown,
  DEV_PREVIEW_MAYBE_EVENT,
  isDevPreviewMaybeEnabled,
  setDevPreviewMaybeEnabled,
} from "../../lib/sourceConsensus";
import { formatParsedStatusAnswer } from "../../lib/pollDisplay";

export function SourceConsensusPanel({ isAlive }: { isAlive: boolean }) {
  const dataSources = useQuery(api.dataSources.list);
  const [previewMaybe, setPreviewMaybe] = useState(false);

  useEffect(() => {
    const syncPreview = () => setPreviewMaybe(isDevPreviewMaybeEnabled());
    syncPreview();
    window.addEventListener(DEV_PREVIEW_MAYBE_EVENT, syncPreview);
    return () => window.removeEventListener(DEV_PREVIEW_MAYBE_EVENT, syncPreview);
  }, []);

  const breakdown = analyzeSourceConsensusBreakdown(dataSources, {
    isAlive,
    previewMaybe,
  });

  return (
    <section className="admin-card rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl">Source consensus</h2>
          <p className="mt-2 opacity-80">
            Weighted disagreement drives the public MAYBE state while admin status
            remains YES.
          </p>
        </div>
        {import.meta.env.DEV && (
          <button
            type="button"
            className={`admin-btn rounded-lg px-4 py-2 ${previewMaybe ? "admin-btn-danger" : ""}`}
            onClick={() => setDevPreviewMaybeEnabled(!previewMaybe)}
          >
            {previewMaybe ? "Disable MAYBE preview" : "Preview MAYBE on homepage"}
          </button>
        )}
      </div>

      {import.meta.env.DEV && previewMaybe && (
        <p className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Dev preview is active. Open the homepage in another tab to see MAYBE
          without changing data sources.
        </p>
      )}

      {dataSources === undefined ? (
        <p className="mt-4 opacity-70">Loading data sources…</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.15em] opacity-70">
                Hero answer
              </p>
              <p className="mt-2 text-2xl font-bold">{breakdown.heroAnswer}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.15em] opacity-70">
                Alive score
              </p>
              <p className="mt-2 text-2xl font-bold">{breakdown.aliveScore}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.15em] opacity-70">
                Deceased score
              </p>
              <p className="mt-2 text-2xl font-bold">{breakdown.deceasedScore}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.15em] opacity-70">
                Deceased share
              </p>
              <p className="mt-2 text-2xl font-bold">
                {breakdown.deceasedSharePercent.toFixed(1)}%
              </p>
            </div>
          </div>

          {breakdown.statusLine && (
            <p className="mt-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <span className="font-mono text-xs uppercase tracking-[0.15em] opacity-70">
                Status line
              </span>
              <span className="mt-2 block">{breakdown.statusLine}</span>
            </p>
          )}

          <div className="mt-6">
            <h3 className="font-display text-lg">Checks</h3>
            <ul className="mt-3 space-y-2">
              {breakdown.checks.map((check) => (
                <li
                  key={check.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-white/10 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold">
                      {check.passed ? "✓" : "✗"} {check.label}
                    </p>
                    <p className="mt-1 font-mono text-xs opacity-70">{check.detail}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      check.passed
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-red-500/15 text-red-300"
                    }`}
                  >
                    {check.passed ? "pass" : "fail"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 overflow-x-auto">
            <h3 className="font-display text-lg">Source contributions</h3>
            <table className="mt-3 w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] opacity-70">
                    Source
                  </th>
                  <th className="px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] opacity-70">
                    Status
                  </th>
                  <th className="px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] opacity-70">
                    Confidence
                  </th>
                  <th className="px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] opacity-70">
                    Scored
                  </th>
                  <th className="px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] opacity-70">
                    Contribution
                  </th>
                </tr>
              </thead>
              <tbody>
                {breakdown.sources.map((source) => (
                  <tr key={source.name} className="border-b border-white/10">
                    <td className="px-3 py-2">{source.name}</td>
                    <td className="px-3 py-2">
                      {formatParsedStatusAnswer(source.currentStatus)}
                    </td>
                    <td className="px-3 py-2">{source.confidence}</td>
                    <td className="px-3 py-2">
                      {source.scorable ? "yes" : source.skipReason ?? "no"}
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {source.contribution > 0
                        ? `${source.side} +${source.contribution}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
