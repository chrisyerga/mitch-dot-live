import { useEffect, useState } from "react";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function diff(from: Date, now: Date) {
  let years = now.getFullYear() - from.getFullYear();
  const anniv = new Date(from);
  anniv.setFullYear(from.getFullYear() + years);
  if (anniv > now) {
    years -= 1;
    anniv.setFullYear(from.getFullYear() + years);
  }
  const ms = now.getTime() - anniv.getTime();
  const days = Math.floor(ms / 86400000);
  const rem = ms % 86400000;
  const h = Math.floor(rem / 3600000);
  const m = Math.floor((rem % 3600000) / 60000);
  const s = Math.floor((rem % 60000) / 1000);
  return { years, days, h, m, s };
}

function liveStr(d: ReturnType<typeof diff>): string {
  return `${d.days}d ${pad(d.h)}:${pad(d.m)}:${pad(d.s)}`;
}

const born = new Date("1942-02-20T05:00:00Z");
const senate = new Date("1985-01-03T05:00:00Z");

export function StatsSection() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const age = diff(born, now);
  const tenure = diff(senate, now);

  return (
    <section className="mx-auto max-w-[1180px] px-6 py-8">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
        <article className="stat-card reveal-up">
          <div className="stat-label">Age</div>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="stat-number text-[color:var(--accent2)]">{age.years}</span>
            <span className="text-xl font-semibold text-[color:var(--fg)]">years old</span>
          </div>
          <div className="stat-live mt-2 font-mono text-base text-[color:var(--muted)]">
            {liveStr(age)}
          </div>
          <div className="stat-footnote mt-4 border-t border-[color:var(--line)] pt-3 text-[13px] text-[color:var(--muted)]">
            Born February 20, 1942 · Sheffield, Alabama
          </div>
        </article>
        <article className="stat-card reveal-up reveal-up-delay-1">
          <div className="stat-label">Time in the Senate</div>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="stat-number text-[color:var(--accent)]">{tenure.years}</span>
            <span className="text-xl font-semibold text-[color:var(--fg)]">years</span>
          </div>
          <div className="stat-live mt-2 font-mono text-base text-[color:var(--muted)]">
            {liveStr(tenure)}
          </div>
          <div className="stat-footnote mt-4 border-t border-[color:var(--line)] pt-3 text-[13px] text-[color:var(--muted)]">
            Sworn in January 3, 1985
          </div>
        </article>
      </div>
    </section>
  );
}
