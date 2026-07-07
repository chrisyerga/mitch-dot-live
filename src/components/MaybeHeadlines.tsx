import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

function domainFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function MaybeHeadlines() {
  const matches = useQuery(api.pollSnapshots.listWireHeadlineMatches);

  if (!matches?.length) {
    return null;
  }

  return (
    <div className="maybe-headlines mt-4 w-full max-w-[640px] rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)]/80 p-4 text-left">
      <p className="m-0 mb-3 text-xs font-bold tracking-[0.08em] text-[color:var(--muted)] uppercase">
        Wire headlines driving MAYBE
      </p>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {matches.map((match) => {
          const source =
            domainFromUrl(match.sourceUrl) ?? domainFromUrl(match.link) ?? "Wire";
          return (
            <li key={match.link}>
              <a
                href={match.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block no-underline"
              >
                <span className="text-[11px] font-bold tracking-wide text-[color:var(--accent)] uppercase">
                  {source}
                </span>
                <p className="m-0 mt-1 text-sm leading-snug font-semibold text-[color:var(--fg)] group-hover:text-[color:var(--accent2)]">
                  {match.title}
                </p>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
