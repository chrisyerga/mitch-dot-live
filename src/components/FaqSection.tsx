import { faqs } from "../data/faq";

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
              window.posthog?.capture("faq_item_expanded", {
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
          <div className="faq-answer">{faq.answer}</div>
        </details>
      ))}
    </section>
  );
}
