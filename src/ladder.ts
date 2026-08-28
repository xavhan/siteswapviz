import { CHAR_W } from "./layout";
import { stateString, throwChar } from "./siteswap";
import type { WalkView } from "./walk";

const Y_R = 52;
const Y_L = 112;
const PAD_L = 46;
const PAD_R = 26;
const TOP = 22;
const BOTTOM = 44; // room for the per-beat state strings

/** Right hand throws on even beats, left on odd — that is what makes odd throws cross. */
const row = (beat: number) => (beat % 2 === 0 ? Y_R : Y_L);

/**
 * How many beats the ladder draws, which is also how far the animation counts
 * before it loops. A closed pattern gets a whole number of periods, two if they
 * fit, never more than 16 beats wide. The whole-number part is load-bearing: the
 * animation wraps its beat on this, so a window that cut a period in half would
 * put the cursor out of step with the balls.
 */
export const beatCount = (throws: number[], closed: boolean): number => {
  const p = throws.length;
  if (!closed) return p;
  const reps = Math.max(1, Math.min(Math.floor(16 / p), Math.max(2, Math.ceil(7 / p))));
  return p * reps;
};

export function renderLadder(v: WalkView, cursor: number | null): string {
  const { throws, h, closed } = v;
  if (!throws.length) return "";

  const p = throws.length;
  const beats = beatCount(throws, closed);
  const beatW = Math.max(58, h * CHAR_W + 20);
  const beatX = (b: number) => PAD_L + b * beatW;
  // the last beat's state string is centred on its tick, so reserve half of it
  const width = PAD_L + beats * beatW + Math.max(PAD_R, (h * CHAR_W) / 2 + 10);
  const height = Y_L + BOTTOM;

  const throwAt = (b: number) => throws[((b % p) + p) % p]!;

  const arcs: string[] = [];
  const LEFT = PAD_L - 24;
  const RIGHT = width - PAD_R + 14;

  // Start before beat 0: at any cursor, the balls in flight were thrown up to
  // maxThrow beats earlier. Without this pre-roll the cursor at beat 0 crosses
  // nothing while its state says three balls are airborne.
  const maxT = Math.max(...throws);
  for (let i = -maxT; i < beats; i++) {
    const t = throwAt(i);
    const land = i + t;
    if (land < 0) continue; // thrown and caught entirely before the window

    if (t === 0) {
      if (i >= 0) arcs.push(`<circle class="hole" cx="${beatX(i)}" cy="${row(i)}" r="4" />`);
      continue;
    }

    // airborne across the cursor: thrown before it, lands at or after it
    const crossing = cursor !== null && i < cursor && land >= cursor;
    const clipped = i < 0 || land > beats;
    const x1 = i >= 0 ? beatX(i) : LEFT;
    const x2 = land <= beats ? beatX(land) : RIGHT;
    const y1 = row(i);
    const y2 = row(land);
    const mx = (x1 + x2) / 2;
    const d =
      y1 === y2
        ? // same hand: arc clear of the rails, higher for bigger throws
          `M ${x1} ${y1} Q ${mx} ${y1 + (y1 === Y_R ? -1 : 1) * (16 + t * 5)} ${x2} ${y2}`
        : // crossing hands: through the middle band, bowed by height so 1s and 5s separate
          `M ${x1} ${y1} Q ${mx} ${(y1 + y2) / 2 + (y1 === Y_R ? -1 : 1) * t * 3} ${x2} ${y2}`;
    arcs.push(
      `<path class="arc${clipped ? " clipped" : ""}${crossing ? " crossing" : ""}" d="${d}" />`,
    );
  }

  const marks: string[] = [];
  for (let b = 0; b <= beats; b++) {
    const x = beatX(b);
    marks.push(`<text class="beatno" x="${x}" y="${TOP - 8}">${b}</text>`);
    if (b < beats) {
      marks.push(`<circle class="beatdot" cx="${x}" cy="${row(b)}" r="2.5" />`);
      marks.push(
        `<text class="throwno" x="${x + 9}" y="${row(b) + (row(b) === Y_R ? -9 : 13)}">${throwChar(throwAt(b))}</text>`,
      );
    }
    const at = v.stateAtBeat(b);
    if (at !== null)
      marks.push(
        `<text class="slab${cursor === b ? " at" : ""}" x="${x}" y="${Y_L + 30}">${stateString(at, h)}</text>`,
      );
  }

  const line =
    cursor === null
      ? ""
      : `<line class="cursorline" x1="${beatX(cursor)}" y1="${TOP}" x2="${beatX(cursor)}" y2="${Y_L + 16}" />`;

  const hits = Array.from(
    { length: beats + 1 },
    (_, b) =>
      `<rect class="hit" data-beat="${b}" x="${beatX(b) - beatW / 2}" y="0" width="${beatW}" height="${height}" />`,
  ).join("");

  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <line class="rail" x1="${PAD_L - 14}" y1="${Y_R}" x2="${width - PAD_R + 8}" y2="${Y_R}" />
    <line class="rail" x1="${PAD_L - 14}" y1="${Y_L}" x2="${width - PAD_R + 8}" y2="${Y_L}" />
    <text class="hand" x="4" y="${Y_R + 4}">R</text>
    <text class="hand" x="4" y="${Y_L + 4}">L</text>
    ${arcs.join("")}${line}${marks.join("")}${hits}
  </svg>`;
}
