/** Neutral theme accent2 (navy) and accent (red). */
const BLUE = [10, 0, 200] as const;
const RED = [179, 25, 66] as const;

export function hashString(value: string): number {
  let hash = 5381;
  for (const char of value.toLowerCase()) {
    hash = (hash * 33) ^ char.charCodeAt(0);
  }
  return hash >>> 0;
}

function lerpChannel(start: number, end: number, t: number): number {
  return Math.round(start + (end - start) * t);
}

function mixWithWhite([r, g, b]: readonly [number, number, number], amount: number) {
  return [
    lerpChannel(r, 255, amount),
    lerpChannel(g, 255, amount),
    lerpChannel(b, 255, amount),
  ] as const;
}

/** Light pill colors on a blue→red ramp, stable per tag string. */
export function getTagPillStyle(tag: string): {
  backgroundColor: string;
  color: string;
} {
  const t = (hashString(tag) % 1000) / 1000;
  const rgb: [number, number, number] = [
    lerpChannel(BLUE[0], RED[0], t),
    lerpChannel(BLUE[1], RED[1], t),
    lerpChannel(BLUE[2], RED[2], t),
  ];

  const bg = mixWithWhite(rgb, 0.72);
  const text = mixWithWhite(rgb, 0.08);

  return {
    backgroundColor: `rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`,
    color: `rgb(${text[0]}, ${text[1]}, ${text[2]})`,
  };
}
