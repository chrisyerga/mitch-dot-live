import { useMemo } from "react";
import type { SiteTheme } from "../lib/themes";

type Deco = {
  dots: Array<{ left: string; top: string; size: number; dur: string }>;
  confetti: Array<{
    left: string;
    size: number;
    color: string;
    round: string;
    dur: string;
    delay: string;
  }>;
  floats: Array<{
    emoji: string;
    left: string;
    top: string;
    size: number;
    dur: string;
    delay: string;
  }>;
  rain: Array<{
    left: string;
    len: number;
    dur: string;
    delay: string;
    op: string;
  }>;
  clouds: Array<{
    top: string;
    w: number;
    h: number;
    dur: number;
    delay: number;
    op: string;
  }>;
};

function buildDeco(): Deco {
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);
  const palette = ["#ff5da2", "#ff9a00", "#ffe14d", "#5ad06a", "#4db4ff", "#9b6bff"];
  const flowerEmoji = ["🌻", "🌸", "🌼", "🌈", "🦋", "🐝", "🌷", "💐", "🐱", "☀️", "🌺", "🍀"];

  return {
    dots: Array.from({ length: 7 }, () => ({
      left: rnd(2, 96).toFixed(1),
      top: rnd(8, 90).toFixed(1),
      size: Math.round(rnd(120, 320)),
      dur: rnd(8, 16).toFixed(1),
    })),
    confetti: Array.from({ length: 28 }, () => ({
      left: rnd(0, 100).toFixed(1),
      size: Math.round(rnd(8, 16)),
      color: palette[Math.floor(Math.random() * palette.length)] ?? "#ff5da2",
      round: Math.random() > 0.5 ? "50%" : "2px",
      dur: rnd(5, 10).toFixed(1),
      delay: rnd(0, 7).toFixed(1),
    })),
    floats: Array.from({ length: 13 }, (_, i) => ({
      emoji: flowerEmoji[i % flowerEmoji.length] ?? "🌻",
      left: rnd(2, 94).toFixed(1),
      top: rnd(6, 88).toFixed(1),
      size: Math.round(rnd(28, 52)),
      dur: rnd(4.5, 8).toFixed(1),
      delay: rnd(0, 4).toFixed(1),
    })),
    rain: Array.from({ length: 110 }, () => ({
      left: rnd(-4, 102).toFixed(1),
      len: Math.round(rnd(50, 124)),
      dur: rnd(0.5, 1.1).toFixed(2),
      delay: rnd(0, 2.5).toFixed(2),
      op: rnd(0.3, 0.65).toFixed(2),
    })),
    clouds: Array.from({ length: 5 }, () => {
      const w = Math.round(rnd(180, 360));
      return {
        top: rnd(2, 32).toFixed(1),
        w,
        h: Math.round(w * 0.5),
        dur: Math.round(rnd(40, 80)),
        delay: Math.round(rnd(0, 24)),
        op: rnd(0.28, 0.55).toFixed(2),
      };
    }),
  };
}

type ThemeDecorationsProps = {
  theme: SiteTheme;
};

export function ThemeDecorations({ theme }: ThemeDecorationsProps) {
  const deco = useMemo(() => buildDeco(), []);

  return (
    <div className="theme-deco pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {theme === "default" &&
        deco.dots.map((d, i) => (
          <div
            key={`dot-${i}`}
            className="theme-deco-dot absolute rounded-full"
            style={{
              left: `${d.left}%`,
              top: `${d.top}%`,
              width: d.size,
              height: d.size,
              animationDuration: `${d.dur}s`,
            }}
          />
        ))}

      {theme === "celebration" && (
        <>
          {deco.confetti.map((c, i) => (
            <div
              key={`confetti-${i}`}
              className="theme-deco-confetti absolute"
              style={{
                left: `${c.left}%`,
                width: c.size,
                height: c.size,
                background: c.color,
                borderRadius: c.round,
                animationDuration: `${c.dur}s`,
                animationDelay: `${c.delay}s`,
              }}
            />
          ))}
          {deco.floats.map((f, i) => (
            <div
              key={`float-${i}`}
              className="theme-deco-float absolute"
              style={{
                left: `${f.left}%`,
                top: `${f.top}%`,
                fontSize: f.size,
                animationDuration: `${f.dur}s`,
                animationDelay: `${f.delay}s`,
              }}
            >
              {f.emoji}
            </div>
          ))}
        </>
      )}

      {theme === "memorial" && (
        <>
          {deco.clouds.map((c, i) => (
            <div
              key={`cloud-${i}`}
              className="theme-deco-cloud absolute"
              style={{
                top: `${c.top}%`,
                width: c.w,
                height: c.h,
                opacity: Number(c.op),
                animationDuration: `${c.dur}s`,
                animationDelay: `${c.delay}s`,
              }}
            />
          ))}
          {deco.rain.map((r, i) => (
            <div
              key={`rain-${i}`}
              className="theme-deco-rain absolute"
              style={{
                left: `${r.left}%`,
                height: r.len,
                opacity: Number(r.op),
                animationDuration: `${r.dur}s`,
                animationDelay: `${r.delay}s`,
              }}
            />
          ))}
          <div className="theme-deco-fog absolute inset-x-0 bottom-0 h-[170px]" />
        </>
      )}
    </div>
  );
}
