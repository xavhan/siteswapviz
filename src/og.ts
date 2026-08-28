import { MAX_HEIGHT, throwChar } from "./siteswap.js";

export const OG_W = 1200;
export const OG_H = 630;

const PAD = 56; // margin around the drawing
const BAND = 150; // the black strip the pattern is written on
const INNER = 54; // throws leave here, on the inside of a hand
const OUTER = 168; // and land here, on the outside of the other one
const RISE = 40; // apex per unit of height
const STRETCH = 2; // how far a tall pattern may be pulled sideways to read
const INK = 4; // how thick a line looks in the finished image
const MAX_CHARS = 12; // longer patterns are cut with an ellipsis
const LABEL = 84; // label type size in the finished image

export const FONT = "JetBrains Mono, ui-monospace, monospace";

/** Even beats belong to the right hand; that parity is what makes odd throws cross. */
const side = (beat: number) => (Math.abs(beat % 2) === 0 ? 1 : -1);

/** A parabola from a throw to a catch, sampled so it is one polyline. */
function parabola(x0: number, x1: number, apex: number, wide: number, samples = 36): string {
  const pts: string[] = [];
  for (let s = 0; s <= samples; s++) {
    const u = s / samples;
    const x = (x0 + (x1 - x0) * u) * wide;
    pts.push(`${x.toFixed(1)},${(-4 * apex * u * (1 - u)).toFixed(1)}`);
  }
  return pts.join(" ");
}

/** Long patterns are cut rather than shrunk, so the type size never wobbles. */
export const label = (pattern: string): string =>
  pattern.length > MAX_CHARS ? `${pattern.slice(0, MAX_CHARS - 1)}\u2026` : pattern;

/**
 * The link-preview picture: the paths the pattern's throws take through the
 * air, and nothing else.
 *
 * Geometric, not physical. No hands, no balls, no carry across a hand: a throw
 * is one parabola from the inside of the hand that makes it to the outside of
 * the hand that catches it, rising with its height. Odd throws
 * cross, even ones come back to the same side, and every distinct path is
 * drawn exactly once, so a cascade is two crossing arcs and a fountain two
 * narrow ones.
 */
export function ogSvg(throws: number[], w = OG_W, h = OG_H): string {
  const p = throws.length;
  // With an odd period a throw leaves the other hand next time round, so it
  // takes two periods to make every path the pattern actually flies.
  const span = p % 2 === 0 ? p : 2 * p;

  const paths: { x0: number; x1: number; apex: number }[] = [];
  const drawn = new Set<string>();
  let wide = 0;
  let top = 0;

  for (let i = 0; i < span; i++) {
    const t = throws[i % p]!;
    if (t === 0) continue; // a hole throws nothing
    const x0 = side(i) * INNER;
    const x1 = side(i + t) * OUTER;
    const key = `${x0}>${x1}>${t}`;
    if (drawn.has(key)) continue; // the same path twice would only thicken it
    drawn.add(key);

    paths.push({ x0, x1, apex: RISE * t });
    wide = Math.max(wide, Math.abs(x0), Math.abs(x1));
    top = Math.max(top, RISE * t);
  }

  // the paths are centred on x=0 and stand on y=0, so their box is known
  const bh = Math.max(top, 1);
  const ground = h - BAND;
  const room = { w: w - 2 * PAD, h: ground - PAD };

  // A tall pattern would otherwise fit by height alone and leave the frame
  // half empty, so pull it sideways — parabolas survive that, and a 9 stacked
  // over a 1 is unreadable at the width bare hand separation gives it.
  const fit = Math.min(room.h / bh, room.w / Math.max(2 * wide, 1));
  const stretch = Math.min(STRETCH, Math.max(1, room.w / (2 * wide * fit)));

  const bw = Math.max(2 * wide * stretch, 1);
  const s = Math.min(room.w / bw, room.h / bh);
  const body = paths
    .map(
      ({ x0, x1, apex }) =>
        `<polyline points="${parabola(x0, x1, apex, stretch)}" fill="none" stroke="#000" stroke-width="${(INK / s).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" />`,
    )
    .join("");

  const text = label(throws.map(throwChar).join(""));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#ffffff" />
  <rect x="12" y="12" width="${w - 24}" height="${h - 24}" fill="none" stroke="#000" stroke-width="8" />
  <g transform="translate(${w / 2} ${ground}) scale(${s.toFixed(4)})">${body}</g>
  <rect x="0" y="${ground}" width="${w}" height="${BAND}" fill="#000000" />
  <text x="${w / 2}" y="${ground + BAND / 2}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${LABEL}" font-weight="700" fill="#ffffff">${text}</text>
</svg>`;
}

/** The words that go with the picture: og:title and og:description. */
export function ogText(pattern: string, balls: number, period: number, excited: boolean) {
  return {
    title: `${pattern} — ${balls} ball${balls === 1 ? "" : "s"}, period ${period}`,
    description: `${excited ? "An excited" : "A ground"}-state siteswap, drawn as an animation, a ladder diagram and a walk through its state graph.`,
  };
}
