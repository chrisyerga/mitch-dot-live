import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ScrollReveal } from "./ScrollReveal";

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "America/New_York",
  }).format(new Date(timestamp));
}

export function NewsSection() {
  const news = useQuery(api.news.listPublished);

  return (
    <ScrollReveal>
      <section id="news" className="section-shell mx-auto w-full max-w-4xl px-6 py-20">
        <p className="section-eyebrow font-mono text-xs uppercase tracking-[0.3em]">
          Recent headlines
        </p>
        <h2 className="section-title mt-3 font-display text-4xl md:text-5xl">
          In the news
        </h2>
        <p className="section-lead mt-4 max-w-2xl text-lg opacity-85">
          Curated links about Senator McConnell. Not an exhaustive feed — just
          enough context while you scroll.
        </p>

        {news === undefined ? (
          <p className="mt-10 font-mono text-sm opacity-70">Loading news…</p>
        ) : news.length === 0 ? (
          <p className="mt-10 font-mono text-sm opacity-70">No news items yet.</p>
        ) : (
          <ul className="news-list mt-10 space-y-4">
            {news.map((item) => (
              <li key={item._id} className="news-card rounded-2xl p-5 transition hover:-translate-y-0.5">
                <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] opacity-70">
                  <span>{item.source}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={new Date(item.publishedAt).toISOString()}>
                    {formatDate(item.publishedAt)}
                  </time>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="news-link mt-2 block text-xl font-semibold leading-snug md:text-2xl"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ScrollReveal>
  );
}
