import { useState, type FormEvent } from "react";
import { captureEvent } from "../lib/analytics";

export function NotifySection() {
  const [done, setDone] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    captureEvent("notify_signup_submitted");
    setDone(true);
  };

  return (
    <section id="notify" className="mx-auto max-w-[1180px] px-6 pt-12 pb-16">
      <div className="notify-card relative overflow-hidden px-[clamp(30px,5vw,58px)] py-[clamp(30px,5vw,58px)] text-center">
        <h2 className="section-heading m-0 text-[clamp(26px,3.6vw,38px)]">
          Get notified the moment the answer changes.
        </h2>
        <p className="mt-3 text-base text-[color:var(--muted)]">
          One email. No spam. We hope it never has to arrive.
        </p>
        {done ? (
          <div className="notify-success mx-auto mt-[22px] max-w-[470px] rounded-full px-5 py-4 text-[15px] font-semibold text-[color:var(--fg)]">
            ✓ You&apos;re on the list. We&apos;ll be in touch — hopefully not soon.
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mx-auto mt-[22px] flex max-w-[470px] flex-wrap justify-center gap-2.5"
          >
            <input
              type="email"
              required
              placeholder="you@email.com"
              className="notify-input min-w-[220px] flex-1 rounded-full px-[18px] py-3.5 text-[15px] outline-none"
            />
            <button type="submit" className="notify-button rounded-full px-[26px] py-3.5 text-[15px] font-bold">
              Notify me
            </button>
          </form>
        )}
        <p className="mt-4 text-xs text-[color:var(--muted)]">
          Demo only — no emails are sent from this site.
        </p>
      </div>
    </section>
  );
}
