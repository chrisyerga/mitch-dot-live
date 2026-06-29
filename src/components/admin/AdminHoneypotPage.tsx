import { useEffect, useState } from "react";
import { captureEvent } from "../../lib/analytics";
import { pickRandomHoneypotImage } from "../../lib/adminHoneypot";

export function AdminHoneypotPage() {
  const [imageSrc] = useState(pickRandomHoneypotImage);

  useEffect(() => {
    captureEvent("admin_honeypot_viewed", { image: imageSrc });
  }, [imageSrc]);

  return (
    <div className="admin-shell min-h-screen">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center justify-center px-6 py-20 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300/80">
        Access granted
      </p>
      <h1 className="mt-4 font-display text-4xl leading-tight">
        Welcome, distinguished security researcher
      </h1>
      <img
        src={imageSrc}
        alt=""
        className="mt-6 w-full max-w-sm rounded-lg border border-white/10 object-cover shadow-lg"
      />
      <p className="mt-6 text-base leading-relaxed opacity-85">
        You found the example password from{" "}
        <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm">
          .env.example
        </code>
        . Impressive OSINT. Truly, the cybersecurity community is in your debt.
      </p>
      <p className="mt-4 text-base leading-relaxed opacity-85">
        This is a static status tracker, not a bank vault. The real admin password
        lives in Convex env vars — not in the repo. Maybe go touch grass, or at
        least read the README before your next paste attack.
      </p>
      <p className="mt-8 text-sm opacity-60">
        We logged this moment for posterity. Have a nice day.
      </p>
      <a href="/" className="admin-btn mt-10 inline-block rounded-lg px-6 py-2 no-underline">
        Back to the live tracker
      </a>
      </div>
    </div>
  );
}
