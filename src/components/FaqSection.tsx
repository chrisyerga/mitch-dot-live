import { faqs } from "../data/faq";
import { captureEvent } from "../lib/analytics";

function linkifyAnswer(answer: string) {
  const parts = answer.split(/(\/blog\/[a-z0-9-]+\/)/g);
  if (parts.length === 1) return answer;

  return parts.map((part, index) =>
    part.startsWith("/blog/") ? (
      <a key={index} href={part} className="text-[color:var(--accent2)] hover:underline">
        how this tracker works
      </a>
    ) : (
      part
    ),
  );
}

export function FaqSection() {
  return (
    <section id="faq" className="mx-auto max-w-[780px] px-6 py-11">
      <h2 className="section-heading mb-6">Questions</h2>
      {faqs.map((faq) => (
        <details
          key={faq.question}
          className="faq-item mb-2.5"
          onToggle={(e) => {
            if ((e.currentTarget as HTMLDetailsElement).open) {
              captureEvent("faq_item_expanded", {
                question: faq.question,
              });
            }
          }}
        >
          <summary className="faq-summary">
            {faq.question}
            <span className="faq-icon" aria-hidden="true">
              +
            </span>
          </summary>
          <div className="faq-answer">{linkifyAnswer(faq.answer)}</div>
        </details>
      ))}
    </section>
  );
}
