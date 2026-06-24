import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

type Phase =
  | "typing"
  | "question"
  | "squish"
  | "squished"
  | "split-a"
  | "domain"
  | "fade-q"
  | "dot-in"
  | "slide"
  | "domain-final"
  | "pause"
  | "fadeout"
  | "pause";

const FULL_QUESTION = "is mitch mcconnell alive?";
const TYPE_SPEED_MS = 55;

const TIMING = {
  question: 2000,
  squish: 700,
  squished: 400,
  splitA: 8,
  domain: 5,
  fadeQ: 2,
  dotIn: 550,
  slide: 650,
  domainFinal: 1200,
  fadeout: 600,
} as const;

function LogoTrack({
  trackRef,
  aliveRef,
  qRef,
  trackStyle,
  className,
  showCursor,
}: {
  trackRef: RefObject<HTMLSpanElement | null>;
  aliveRef: RefObject<HTMLSpanElement | null>;
  qRef: RefObject<HTMLSpanElement | null>;
  trackStyle: CSSProperties | undefined;
  className: string;
  showCursor: boolean;
}) {
  return (
    <span ref={trackRef} style={trackStyle} className={className}>
      <span className="site-logo-prefix">
        <span className="site-logo-seg">is</span>
        <span className="site-logo-gap" aria-hidden="true" />
        <span className="site-logo-seg">mitch</span>
        <span className="site-logo-gap" aria-hidden="true" />
        <span className="site-logo-seg">mcconnell</span>
        <span className="site-logo-gap" aria-hidden="true" />
        <span ref={aliveRef} className="site-logo-alive">
          alive
        </span>
        <span className="site-logo-a">a</span>
      </span>
      <span className="site-logo-q-slot" aria-hidden="false">
        <span ref={qRef} className="site-logo-q">
          ?
        </span>
      </span>
      {showCursor && <span className="site-logo-cursor" aria-hidden="true" />}
      <span className="site-logo-tail">
        <span className="site-logo-dot">.</span>
        <span className="site-logo-live">live</span>
      </span>
    </span>
  );
}

export function SiteLogo() {
  const [phase, setPhase] = useState<Phase>("typing");
  const [typedCount, setTypedCount] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [liveAnchor, setLiveAnchor] = useState<number | null>(null);
  const [qAnchor, setQAnchor] = useState<number | null>(null);
  const [gapsCollapsed, setGapsCollapsed] = useState(false);

  const trackRef = useRef<HTMLSpanElement>(null);
  const aliveRef = useRef<HTMLSpanElement>(null);
  const qRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion || phase !== "typing") return;

    setTypedCount(0);
    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setTypedCount(index);
      if (index >= FULL_QUESTION.length) {
        clearInterval(interval);
      }
    }, TYPE_SPEED_MS);

    return () => clearInterval(interval);
  }, [phase, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;

    const sequence: Array<{ phase: Phase; duration: number }> = [
      { phase: "typing", duration: FULL_QUESTION.length * TYPE_SPEED_MS + 100 },
      { phase: "question", duration: TIMING.question },
      { phase: "squish", duration: TIMING.squish },
      { phase: "squished", duration: TIMING.squished },
      { phase: "split-a", duration: TIMING.splitA },
      { phase: "domain", duration: TIMING.domain },
//      { phase: "fade-q", duration: TIMING.fadeQ },
      { phase: "dot-in", duration: TIMING.dotIn },
 //     { phase: "slide", duration: TIMING.slide },
 //     { phase: "domain-final", duration: TIMING.domainFinal },
      { phase: "pause", duration: 5000 },
      { phase: "fadeout", duration: TIMING.fadeout },
    ];

    let index = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const runStep = () => {
      const step = sequence[index];
      if (!step) return;
      setPhase(step.phase);
      timeout = setTimeout(() => {
        index = (index + 1) % sequence.length;
        runStep();
      }, step.duration);
    };

    runStep();
    return () => clearTimeout(timeout);
  }, [reducedMotion]);

  useEffect(() => {
    if (phase === "squish") {
      setGapsCollapsed(false);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setGapsCollapsed(true));
      });
      return () => cancelAnimationFrame(frame);
    }

    if (
      phase === "squished" ||
      phase === "split-a" ||
      phase === "domain" ||
      phase === "fade-q" ||
      phase === "dot-in" ||
      phase === "pause" ||
      phase === "slide" ||
      phase === "domain-final" ||
      phase === "fadeout"
    ) {
      setGapsCollapsed(true);
    }

    if (phase === "typing") {
      setGapsCollapsed(false);
      setLiveAnchor(null);
      setQAnchor(null);
    }
  }, [phase]);

  useLayoutEffect(() => {
    if (phase !== "squished") return;

    const alive = aliveRef.current;
    const track = trackRef.current;
    if (!alive || !track) return;

    const aliveRect = alive.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    setLiveAnchor(aliveRect.left - trackRect.left + aliveRect.width * 0.2);
  }, [phase, gapsCollapsed]);

  useLayoutEffect(() => {
    if (phase !== "domain") return;

    const q = qRef.current;
    const track = trackRef.current;
    if (!q || !track) return;

    const qRect = q.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    setQAnchor(qRect.left - trackRect.left);
  }, [phase]);

  if (reducedMotion) {
    return (
      <a
        href="/"
        className="site-logo site-logo-static font-mono text-lg font-bold tracking-tight"
      >
        ismitchmcconnella.live
      </a>
    );
  }

  const showTyped = phase === "typing";
  const showStructured = phase !== "typing";
  const showCursor = phase === "typing" || phase === "question";
  const spaced = (phase === "question" || phase === "squish") && !gapsCollapsed;
  const squished = gapsCollapsed && showStructured;
  const splitA =
    phase === "split-a" ||
    phase === "domain" ||
    phase === "fade-q" ||
    phase === "pause" ||
    phase === "dot-in" ||
    phase === "slide" ||
    phase === "domain-final" ||
    phase === "fadeout";
  const qPinned = qAnchor !== null;
  const fadingQ = phase === "fade-q";
  const qHidden =
    phase === "dot-in" ||
    phase === "pause" ||
    phase === "slide" ||
    phase === "domain-final" ||
    phase === "fadeout";
  const showDot =
    phase === "dot-in" ||
    phase === "pause" ||
    phase === "slide" ||
    phase === "domain-final" ||
    phase === "fadeout";
  const slideLeft =
    phase === "slide" ||
    phase === "domain-final" ||
    phase === "fadeout";
  const compact = phase === "domain-final" || phase === "fadeout";
  const fading = phase === "fadeout";

  const typedText = FULL_QUESTION.slice(0, typedCount);

  const trackStyle: CSSProperties = {
    ...(liveAnchor !== null ? { "--live-anchor": `${liveAnchor}px` } : {}),
    ...(qAnchor !== null ? { "--q-anchor": `${qAnchor}px` } : {}),
  };

  const trackClassName = [
    "site-logo-track",
    spaced ? "site-logo-spaced" : "",
    squished ? "site-logo-squished" : "",
    splitA ? "site-logo-split-a" : "",
    qPinned ? "site-logo-q-pinned" : "",
    fadingQ ? "site-logo-fade-q-active" : "",
    qHidden ? "site-logo-q-hidden" : "",
    showDot ? "site-logo-show-dot" : "",
    slideLeft ? "site-logo-slide" : "",
    compact ? "site-logo-compact" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <a
      href="/"
      className={`site-logo font-mono text-lg font-bold tracking-tight ${fading ? "site-logo-fading" : ""}`}
      aria-label="ismitchmcconnella.live — is mitch mcconnell alive?"
    >
      {showTyped ? (
        <span className="site-logo-typed">
          {typedText}
          {showCursor && <span className="site-logo-cursor" aria-hidden="true" />}
        </span>
      ) : (
        <LogoTrack
          trackRef={trackRef}
          aliveRef={aliveRef}
          qRef={qRef}
          trackStyle={Object.keys(trackStyle).length > 0 ? trackStyle : undefined}
          className={trackClassName}
          showCursor={showCursor}
        />
      )}
    </a>
  );
}
