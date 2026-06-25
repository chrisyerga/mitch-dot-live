import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { captureEvent } from "../lib/analytics";

function relativeWhen(timestamp: number, now: number): string {
  const diffMs = now - timestamp;
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 24) return `${Math.max(1, hours)}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatPublishedDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(new Date(timestamp));
}

function NewsWhen({ timestamp }: { timestamp: number }) {
  const [label, setLabel] = useState(() => formatPublishedDate(timestamp));

  useEffect(() => {
    setLabel(relativeWhen(timestamp, Date.now()));
  }, [timestamp]);

  return <span suppressHydrationWarning>{label}</span>;
}

export function NewsSection() {
  const news = useQuery(api.news.listPublished);

  return (
    <section id="news" className="mx-auto max-w-[1180px] px-6 py-11">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h2 className="section-heading m-0">In the news</h2>
        <span className="text-[13px] text-[color:var(--muted)]">
          Curated links · updated from the admin panel
        </span>
      </div>

      {news === undefined ? (
        <p className="text-sm text-[color:var(--muted)]">Loading news…</p>
      ) : news.length === 0 ? (
        <p className="text-sm text-[color:var(--muted)]">No news items yet.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(248px,1fr))] gap-[18px]">
          {news.map((item) => (
            <a
              key={item._id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="news-card reveal-up group flex flex-col overflow-hidden no-underline"
              onClick={() => {
                captureEvent("news_link_clicked", {
                  title: item.title,
                  source: item.source,
                  url: item.url,
                });
              }}
            >
              <div
                className={`news-card-photo flex h-[138px] items-center justify-center overflow-hidden border-b border-[color:var(--line)] ${
                  item.imageUrl ? "news-card-photo-filled" : ""
                }`}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="rounded bg-[color:var(--surface)] px-2 py-1 font-mono text-[11px] tracking-[0.12em] text-[color:var(--muted)]">
                    PHOTO
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold tracking-wide text-[color:var(--accent)] uppercase">
                    {item.source}
                  </span>
                  <span className="text-[11px] text-[color:var(--muted)]">
                    · <NewsWhen timestamp={item.publishedAt} />
                  </span>
                </div>
                <p className="m-0 text-[15px] leading-snug font-semibold text-[color:var(--fg)] group-hover:text-[color:var(--accent2)]">
                  {item.title}
                </p>
                <span className="mt-auto text-[13px] font-semibold text-[color:var(--accent2)]">
                  Read →
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
