import { bioFacts } from "../data/facts";
import { BLOG_ENABLED } from "../lib/blogConfig";
import { SITE } from "../lib/site";

export function BioSection() {
  return (
    <section id="bio" className="mx-auto max-w-[1180px] px-6 py-11">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h2 className="section-heading m-0">Biography</h2>
        <span className="text-[13px] text-[color:var(--muted)]">Quick facts</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-start gap-6">
        <div className="bio-portrait bio-portrait-filled reveal-up overflow-hidden">
          <img
            src={SITE.officialPhotoUrl}
            alt="Official portrait of Senator Mitch McConnell"
            className="h-full min-h-[360px] w-full object-cover object-[center_12%]"
            loading="lazy"
          />
        </div>
        <div className="reveal-up reveal-up-delay-1">
          <p className="mb-[18px] text-base leading-[1.65] text-[color:var(--fg)]">
            A Republican from Kentucky, he is among the longest-serving members of the U.S.
            Senate and was its longest-serving party leader in history. This page exists to
            answer one recurring question, plainly and continuously.
            {BLOG_ENABLED && (
              <>
                {" "}
                <a href="/blog/how-old-is-mitch-mcconnell/" className="text-[color:var(--accent2)] hover:underline">
                  Read more about his age and tenure
                </a>
                .
              </>
            )}
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
