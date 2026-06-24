import { statusTimeline } from "../data/timeline";

export function TimelineSection() {
  return (
    <section id="timeline" className="mx-auto max-w-[900px] px-6 py-11">
      <h2 className="section-heading mb-6">Status history</h2>
      <div className="flex flex-col">
        {statusTimeline.map((item) => (
          <div key={item.date + item.event} className="timeline-row reveal-up grid grid-cols-[96px_1fr_auto] items-center gap-4 border-b border-[color:var(--line)] py-4">
            <span className="text-xs font-bold tracking-wide text-[color:var(--muted)]">
              {item.date}
            </span>
            <span className="text-[15px] leading-snug text-[color:var(--fg)]">{item.event}</span>
            <span
              className={`timeline-badge whitespace-nowrap ${
                item.status === "LIVE" ? "timeline-badge-live" : ""
              }`}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
