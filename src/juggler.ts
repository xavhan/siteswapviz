import { throwChar } from "./siteswap";

const NS = "http://www.w3.org/2000/svg";

const W = 380;
const INNER = 26; // throws leave from inside, near the centre line
const OUTER = 74; // catches land outside, where the hand has swung to
const BALL_R = 11; // wide enough to print the throw height inside
const DWELL = 0.4; // beats a hand holds a ball, carrying it from catch to throw

const FLOOR = 52; // hands sit this far off the bottom of the box
const HEADROOM = 86; // hand zone plus the beat caption

const MAX_THROW = 9; // the app's height cap: what "full height" is calibrated to

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const ease = (u: number) => u * u * (3 - 2 * u);
/** Even beats belong to the right hand; that parity is what makes odd throws cross. */
const side = (beat: number) => ((((beat % 2) + 2) % 2) === 0 ? 1 : -1);

export type Stage = { el: SVGSVGElement; update: (beat: number) => void };

export function buildStage(throws: number[], balls: number, boxH: number): Stage {
  const p = throws.length;
  const maxT = Math.max(...throws, 1);
  const handY = boxH - FLOOR;
  const cx = W / 2;

  // Absolute px per t², NOT normalised per pattern — so a 5-ball pattern really
  // does tower over a 3-ball one. Flight time is t beats, so apex goes as t².
  // K is pinned to the tallest LEGAL throw, not this pattern's tallest, so the
  // scale is identical for every pattern at a given window size.
  const K = (boxH - HEADROOM) / (MAX_THROW * MAX_THROW);
  const apex = (t: number) => K * t * t;

  const throwPos = (beat: number) => ({ x: cx + side(beat) * INNER, y: handY - 6 });
  const catchPos = (beat: number) => ({ x: cx + side(beat) * OUTER, y: handY + 4 });

  /** Where the ball thrown at beat `i` is at time `b`: in flight, then carried. */
  const ballAt = (i: number, t: number, b: number) => {
    const land = i + t;
    const touchdown = land - DWELL;
    if (b <= touchdown) {
      const from = throwPos(i);
      const to = catchPos(land);
      const u = (b - i) / (touchdown - i);
      return { x: lerp(from.x, to.x, u), y: lerp(from.y, to.y, u) - 4 * apex(t) * u * (1 - u) };
    }
    // carried across the hand, ending exactly where the next throw departs
    const from = catchPos(land);
    const to = throwPos(land);
    const u = (b - touchdown) / DWELL;
    return { x: lerp(from.x, to.x, ease(u)), y: lerp(from.y, to.y, ease(u)) + 3 * Math.sin(Math.PI * u) };
  };

  /** A hand swings out empty to meet the catch, then carries the ball back in. */
  const handAt = (parity: number, b: number) => {
    const k = Math.floor((b - parity) / 2) * 2 + parity;
    const next = k + 2;
    const touchdown = next - DWELL;
    if (b <= touchdown) {
      const from = throwPos(k);
      const to = catchPos(next);
      const u = (b - k) / (touchdown - k);
      return { x: lerp(from.x, to.x, ease(u)), y: lerp(from.y, to.y, ease(u)) + 7 * Math.sin(Math.PI * u) };
    }
    const from = catchPos(next);
    const to = throwPos(next);
    const u = (b - touchdown) / DWELL;
    return { x: lerp(from.x, to.x, ease(u)), y: lerp(from.y, to.y, ease(u)) };
  };

  // Trajectories, sampled from the very function that moves the balls, so the
  // drawn path cannot drift from where a ball actually goes.
  // Hands alternate every beat, so with an odd period each throw index lands on
  // the other hand next time round: 531's index 0 falls on beats 0, 3, 6 —
  // even, odd, even. Such a throw has two mirrored paths, so span two periods.
  const span = p % 2 === 0 ? p : 2 * p;
  const trails = Array.from({ length: span }, (_, i) => {
    const t = throws[i % p]!;
    if (t === 0) return "";
    const pts: string[] = [];
    for (let s = 0; s <= 20; s++) {
      const b = i + ((t - DWELL) * s) / 20;
      const { x, y } = ballAt(i, t, b);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return `<polyline class="traj" points="${pts.join(" ")}" />`;
  }).join("");

  const el = document.createElementNS(NS, "svg");
  el.setAttribute("viewBox", `0 0 ${W} ${boxH}`);
  el.setAttribute("width", String(W));
  el.setAttribute("height", String(boxH));
  el.innerHTML =
    trails +
    `<rect class="handbar" width="38" height="8" />` +
    `<rect class="handbar" width="38" height="8" />` +
    `<text class="beattag" x="${W / 2}" y="16"></text>` +
    Array.from(
      { length: balls },
      () => `<g class="ball"><circle r="${BALL_R}" /><text></text></g>`,
    ).join("");

  const hands = [...el.querySelectorAll<SVGRectElement>(".handbar")];
  const pool = [...el.querySelectorAll<SVGGElement>(".ball")];
  const tag = el.querySelector<SVGTextElement>(".beattag")!;

  const update = (beat: number) => {
    hands.forEach((hand, parity) => {
      const { x, y } = handAt(parity, beat);
      hand.setAttribute("x", String(x - 19));
      hand.setAttribute("y", String(y));
    });

    let n = 0;
    for (let i = Math.floor(beat) - maxT; i <= Math.floor(beat); i++) {
      const t = throws[((i % p) + p) % p]!;
      if (t === 0) continue; // empty hand, no ball to draw
      if (!(i <= beat && beat < i + t)) continue; // same airborne test the ladder uses
      const ball = pool[n++];
      if (!ball) break;
      const { x, y } = ballAt(i, t, beat);
      ball.setAttribute("transform", `translate(${x} ${y})`);
      // Throw height used to be a hue. Brute has no colour, so print the digit
      // on the ball instead — exact rather than a hue you decode.
      ball.querySelector("text")!.textContent = throwChar(t);
      ball.style.display = "";
    }
    for (let k = n; k < pool.length; k++) pool[k]!.style.display = "none";
    tag.textContent = `beat ${((Math.floor(beat) % p) + p) % p}`;
  };

  update(0);
  return { el, update };
}
