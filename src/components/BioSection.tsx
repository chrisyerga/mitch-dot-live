import { bioFacts } from "../data/facts";

export function BioSection() {
  return (
    <section id="bio" className="mx-auto max-w-[1180px] px-6 py-11">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h2 className="section-heading m-0">Biography</h2>
        <span className="text-[13px] text-[color:var(--muted)]">Quick facts</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-start gap-6">
        <div className="bio-portrait reveal-up flex min-h-[360px] items-center justify-center">
          <span className="rounded bg-[color:var(--surface)] px-2.5 py-1 font-mono text-[11px] tracking-[0.12em] text-[color:var(--muted)]">
            PORTRAIT
          </span>
        </div>
        <div className="reveal-up reveal-up-delay-1">
          <p className="mb-[18px] text-base leading-[1.65] text-[color:var(--fg)]">
            A Republican from Kentucky, he is among the longest-serving members of the U.S.
            Senate and was its longest-serving party leader in history. This page exists to
            answer one recurring question, plainly and continuously.
          </p>
          <div>
            {bioFacts.map((fact) => (
              <div
                key={fact.key}
                className="flex justify-between gap-4 border-b border-[color:var(--line)] py-3.5"
              >
                <span className="shrink-0 text-[13px] font-semibold tracking-wide text-[color:var(--muted)]">
                  {fact.key}
                </span>
                <span className="text-right text-sm text-[color:var(--fg)]">{fact.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
