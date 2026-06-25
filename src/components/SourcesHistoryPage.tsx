import { usePaginatedQuery, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { SiteHeader } from "./SiteHeader";
import { formatCheckedAt } from "../lib/format";
import {
  formatAnswerDetail,
  formatParsedStatusAnswer,
  parsedStatusTone,
} from "../lib/pollDisplay";

const toneClassName = {
  positive: "data-source-answer-positive",
  negative: "data-source-answer-negative",
  neutral: "data-source-answer-neutral",
  error: "data-source-answer-error",
} as const;

function SourcesHistoryInner() {
  const sources = useQuery(api.dataSources.list);
  const [filterKey, setFilterKey] = useState<string>("all");
  const { results, status, loadMore } = usePaginatedQuery(
    api.pollSnapshots.listRecent,
    filterKey === "all" ? {} : { dataSourceKey: filterKey },
    { initialNumItems: 25 },
  );

  return (
    <div className="site-root relative min-h-screen overflow-x-hidden bg-[color:var(--bg)] text-[color:var(--fg)]">
      <div className="relative z-[1]">
        <SiteHeader />
        <main className="mx-auto max-w-[1180px] px-6 py-10">
          <div className="mb-8">
            <p className="m-0 mb-3">
              <a
                href="/"
                className="text-sm font-semibold text-[color:var(--accent2)] no-underline hover:underline"
              >
                ← Back to status
              </a>
            </p>
            <h1 className="section-heading m-0 mb-2">Data source polling</h1>
            <p className="m-0 max-w-[720px] text-[15px] leading-relaxed text-[color:var(--muted)]">
              Automated checks against external sources. The site&apos;s YES/NO
              answer is confirmed by a human editor. When data sources are conflicting, the page will report that there is conflicting information. this page shows what each
              source is reporting and when it was last checked.
            </p>
          </div>

          <section className="mb-10">
            <h2 className="m-0 mb-4 text-lg font-semibold text-[color:var(--fg)]">
              Current readings
            </h2>
            {sources === undefined ? (
              <p className="text-sm text-[color:var(--muted)]">Loading sources…</p>
            ) : sources.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">No data sources yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)]/60">
                <table className="data-sources-table w-full min-w-[520px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[color:var(--line)] text-left">
                      <th className="px-4 py-3 text-[11px] font-bold tracking-[0.08em] text-[color:var(--muted)] uppercase">
                        Source
                      </th>
                      <th className="px-4 py-3 text-[11px] font-bold tracking-[0.08em] text-[color:var(--muted)] uppercase">
                        Answer
                      </th>
                      <th className="px-4 py-3 text-[11px] font-bold tracking-[0.08em] text-[color:var(--muted)] uppercase">
                        Last checked
                      </th>
                      <th className="px-4 py-3 text-[11px] font-bold tracking-[0.08em] text-[color:var(--muted)] uppercase">
                        Enabled
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sources.map((source) => {
                      const tone = parsedStatusTone(source.currentStatus);
                      return (
                        <tr
                          key={source.key}
                          className="border-b border-[color:var(--line)] last:border-b-0"
                        >
                          <td className="px-4 py-3 align-top">
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-[color:var(--fg)] no-underline hover:text-[color:var(--accent2)] hover:underline"
                            >
                              {source.name}
                            </a>
                            <p className="m-0 mt-1 font-mono text-[11px] text-[color:var(--muted)]">
                              {source.key}
                            </p>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClassName[tone]}`}
                            >
                              {formatParsedStatusAnswer(source.currentStatus)}
                            </span>
                            {source.currentStatusDetail && (
                              <p className="m-0 mt-1 text-xs text-[color:var(--muted)]">
                                {formatAnswerDetail(
                                  source.currentStatus,
                                  source.currentStatusDetail,
                                )}
                              </p>
                            )}
                            {source.lastError && (
                              <p className="m-0 mt-1 text-xs text-[color:var(--danger,#c0392b)]">
                                {source.lastError}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top font-mono text-xs text-[color:var(--muted)] whitespace-nowrap">
                            {formatCheckedAt(source.lastCheckedAt)}
                          </td>
                          <td className="px-4 py-3 align-top text-xs text-[color:var(--muted)]">
                            {source.enabled ? "Yes" : "No"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
              <h2 className="m-0 text-lg font-semibold text-[color:var(--fg)]">
                Polling history
              </h2>
              {sources && sources.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
                  Filter
                  <select
                    value={filterKey}
                    onChange={(event) => setFilterKey(event.target.value)}
                    className="rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-2 py-1 text-sm text-[color:var(--fg)]"
                  >
                    <option value="all">All sources</option>
                    {sources.map((source) => (
                      <option key={source.key} value={source.key}>
                        {source.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            {results === undefined ? (
              <p className="text-sm text-[color:var(--muted)]">Loading history…</p>
            ) : results.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">
                No poll snapshots recorded yet.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)]/60">
                  <table className="data-sources-table w-full min-w-[720px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[color:var(--line)] text-left">
                        <th className="px-4 py-3 text-[11px] font-bold tracking-[0.08em] text-[color:var(--muted)] uppercase">
                          Checked at
                        </th>
                        <th className="px-4 py-3 text-[11px] font-bold tracking-[0.08em] text-[color:var(--muted)] uppercase">
                          Source
                        </th>
                        <th className="px-4 py-3 text-[11px] font-bold tracking-[0.08em] text-[color:var(--muted)] uppercase">
                          Result
                        </th>
                        <th className="px-4 py-3 text-[11px] font-bold tracking-[0.08em] text-[color:var(--muted)] uppercase">
                          Summary
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((snapshot) => {
                        const tone = parsedStatusTone(snapshot.parsedStatus);
                        return (
                          <tr
                            key={snapshot._id}
                            className="border-b border-[color:var(--line)] last:border-b-0"
                          >
                            <td className="px-4 py-3 align-top font-mono text-xs text-[color:var(--muted)] whitespace-nowrap">
                              {formatCheckedAt(snapshot.fetchedAt)}
                            </td>
                            <td className="px-4 py-3 align-top">
                              <span className="font-semibold text-[color:var(--fg)]">
                                {snapshot.source}
                              </span>
                              <p className="m-0 mt-1 font-mono text-[11px] text-[color:var(--muted)]">
                                {snapshot.dataSourceKey}
                              </p>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClassName[tone]}`}
                              >
                                {formatParsedStatusAnswer(snapshot.parsedStatus)}
                              </span>
                              {!snapshot.checkOk && snapshot.error && (
                                <p className="m-0 mt-1 text-xs text-[color:var(--danger,#c0392b)]">
                                  {snapshot.error}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 align-top text-xs text-[color:var(--muted)]">
                              {snapshot.summary ?? "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {status === "CanLoadMore" && (
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => loadMore(25)}
                      className="rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-2 text-sm font-semibold text-[color:var(--fg)] hover:border-[color:var(--accent2)]"
                    >
                      Load more
                    </button>
                  </div>
                )}
                {status === "LoadingMore" && (
                  <p className="mt-4 text-center text-sm text-[color:var(--muted)]">
                    Loading more…
                  </p>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export function SourcesHistoryPage() {
  return (
    <ConvexClientProvider>
      <SourcesHistoryInner />
    </ConvexClientProvider>
  );
}
