// A state is a bitmask over the next `h` beats.
// Bit i set = something lands i beats from now. Bit 0 set = ball in hand, must throw.
export type State = number;

export const bitsOf = (s: State, h: number): number[] => {
  const out: number[] = [];
  for (let i = 0; i < h; i++) if (s & (1 << i)) out.push(i);
  return out;
};

export const stateString = (s: State, h: number): string => {
  let out = "";
  for (let i = 0; i < h; i++) out += (s >> i) & 1;
  return out;
};

export const ground = (n: number): State => (1 << n) - 1;

/** Distance from the ground state, graded so a throw of height t moves you by exactly (t - n). */
export const excitation = (s: State, n: number, h: number): number =>
  bitsOf(s, h).reduce((a, b) => a + b, 0) - (n * (n - 1)) / 2;

export const allStates = (n: number, h: number): State[] => {
  const out: State[] = [];
  for (let s = 0; s < 1 << h; s++) if (bitsOf(s, h).length === n) out.push(s);
  return out;
};

/** The state after throwing height t, or null if that throw is illegal. */
export const step = (s: State, t: number, h: number): State | null => {
  if (!(s & 1)) return t === 0 ? s >> 1 : null; // empty hand: only a hole
  if (t < 1 || t > h) return null;
  const next = s >> 1;
  if (next & (1 << (t - 1))) return null; // two balls landing on the same beat
  return next | (1 << (t - 1));
};

export const throwsFrom = (s: State, h: number): { t: number; to: State }[] => {
  const out: { t: number; to: State }[] = [];
  const top = s & 1 ? h : 0; // empty hand: the hole is the only legal throw
  for (let t = s & 1 ? 1 : 0; t <= top; t++) {
    const to = step(s, t, h);
    if (to !== null) out.push({ t, to });
  }
  return out;
};

export const throwChar = (t: number): string =>
  t < 10 ? String(t) : String.fromCharCode(97 + t - 10);

export const patternString = (throws: number[]): string => throws.map(throwChar).join("");

/** "531", "5 3 1", "b31" -> [5,3,1]. null if it isn't a siteswap at all. */
export const parsePattern = (raw: string): number[] | null => {
  const text = raw.trim().toLowerCase();
  if (!text) return null;
  const parts = /[\s,]/.test(text) ? text.split(/[\s,]+/) : [...text];
  const throws: number[] = [];
  for (const p of parts) {
    if (!p) continue;
    let t: number;
    if (/^\d+$/.test(p)) t = Number(p);
    else if (/^[a-z]$/.test(p)) t = p.charCodeAt(0) - 97 + 10;
    else return null;
    throws.push(t);
  }
  return throws.length ? throws : null;
};

export type Check = { ok: true; balls: number } | { ok: false; error: string };

export const validate = (throws: number[]): Check => {
  const p = throws.length;
  const sum = throws.reduce((a, b) => a + b, 0);
  if (sum % p !== 0)
    return { ok: false, error: `average is ${(sum / p).toFixed(2)} — not a whole number of balls` };
  const landing = new Map<number, number>();
  for (let i = 0; i < p; i++) {
    const beat = (i + throws[i]!) % p;
    const other = landing.get(beat);
    if (other !== undefined)
      return {
        ok: false,
        error: `collision: throw ${other + 1} (${throwChar(throws[other]!)}) and throw ${i + 1} (${throwChar(throws[i]!)}) both land on beat ${beat + 1}`,
      };
    landing.set(beat, i);
  }
  return { ok: true, balls: sum / p };
};

/** The state a periodic pattern sits in at beat 0: which past throws are still airborne. */
export const stateOf = (throws: number[], h: number): State => {
  const p = throws.length;
  const maxT = Math.max(...throws);
  let s = 0;
  for (let k = 1; k <= maxT; k++) {
    const land = throws[(((-k % p) + p) % p)]! - k;
    if (land >= 0 && land < h) s |= 1 << land;
  }
  return s;
};

/** States visited by one period, length p+1; last === first for a valid pattern. */
export const walkOf = (throws: number[], h: number): State[] => {
  let s = stateOf(throws, h);
  const out = [s];
  for (const t of throws) {
    const next = step(s, t, h);
    if (next === null) return out;
    s = next;
    out.push(s);
  }
  return out;
};
