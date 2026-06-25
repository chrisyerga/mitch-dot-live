import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatCheckedAt } from "../lib/format";
import {
  formatParsedStatusAnswer,
  parsedStatusTone,
} from "../lib/pollDisplay";

const toneClassName = {
  positive: "data-source-answer-positive",
  negative: "data-source-answer-negative",
  neutral: "data-source-answer-neutral",
  error: "data-source-answer-error",
} as const;

type DataSourcesTableProps = {
  showHistoryLink?: boolean;
  compact?: boolean;
};

export function DataSourcesTable({
  showHistoryLink = true,
  compact = false,
}: DataSourcesTableProps) {
  const sources = useQuery(api.dataSources.list);

  return (
    <div className="data-sources-panel mx-auto w-full max-w-[640px] text-left">
      {sources === undefined ? (
        <p className="m-0 text-center text-sm text-[color:var(--muted)]">
          Loading data sources…
        </p>
      ) : sources.length === 0 ? (
        <p className="m-0 text-center text-sm text-[color:var(--muted)]">
          No data sources configured yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)]/60">
          <table className="data-sources-table w-full min-w-[420px] border-collapse text-sm">
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
                      {!compact && source.lastError && (
                        <p className="m-0 mt-1 text-xs text-[color:var(--danger,#c0392b)]">
                          {source.lastError}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClassName[tone]}`}
                        title={
                          source.currentStatusDetail ??
                          source.lastError ??
                          undefined
                        }
                      >
                        {formatParsedStatusAnswer(source.currentStatus)}
                      </span>
                      {!compact && source.currentStatusDetail && (
                        <p className="m-0 mt-1 text-xs text-[color:var(--muted)]">
                          {source.currentStatusDetail}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top font-mono text-xs text-[color:var(--muted)] whitespace-nowrap">
                      {formatCheckedAt(source.lastCheckedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showHistoryLink && (
        <p className="m-0 mt-3 text-center text-sm text-[color:var(--muted)]">
          <a
            href="/sources"
            className="font-semibold text-[color:var(--accent2)] no-underline hover:underline"
          >
            View polling history →
          </a>
        </p>
      )}
    </div>
  );
}
