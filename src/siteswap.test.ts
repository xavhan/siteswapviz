import { expect, test } from "vitest";
import {
  allStates,
  bitsOf,
  excitation,
  ground,
  parsePattern,
  stateOf,
  stateString,
  throwsFrom,
  validate,
  walkOf,
} from "./siteswap";

const closes = (throws: number[], h: number) => {
  const w = walkOf(throws, h);
  return w.length === throws.length + 1 && w[0] === w[w.length - 1];
};

test("parses digits, letters and separators", () => {
  expect(parsePattern("531")).toEqual([5, 3, 1]);
  expect(parsePattern("5 3 1")).toEqual([5, 3, 1]);
  expect(parsePattern("b31")).toEqual([11, 3, 1]);
  expect(parsePattern("5z1")).toEqual([5, 35, 1]); // letters run a=10 .. z=35
  expect(parsePattern("5-1")).toBeNull();
  expect(parsePattern("  ")).toBeNull();
});

test("validity: average and collisions", () => {
  expect(validate([5, 3, 1])).toEqual({ ok: true, balls: 3 });
  expect(validate([4, 4, 1])).toEqual({ ok: true, balls: 3 });
  expect(validate([3])).toEqual({ ok: true, balls: 3 });
  expect(validate([5, 2, 1]).ok).toBe(false); // collision
  expect(validate([5, 3, 2]).ok).toBe(false); // average 10/3
});

test("ground patterns sit on the ground state, excited ones do not", () => {
  expect(stateOf([5, 3, 1], 5)).toBe(ground(3));
  expect(stateOf([4, 4, 1], 5)).toBe(ground(3));
  expect(stateOf([3], 5)).toBe(ground(3));
  expect(stateOf([4], 5)).toBe(ground(4));
  expect(stateString(stateOf([5, 1], 5), 5)).toBe("11010"); // 51 is excited
});

test("valid patterns close their cycle", () => {
  for (const [p, h] of [
    [[5, 3, 1], 5],
    [[4, 4, 1], 5],
    [[5, 1], 5],
    [[3], 3],
    [[7, 5, 3, 1], 7],
    [[6, 4, 5], 6],
  ] as [number[], number][])
    expect(closes(p, h), p.join("")).toBe(true);
});

test("state count is C(h, n)", () => {
  const choose = (a: number, b: number): number =>
    b === 0 ? 1 : Math.round(((a - b + 1) / b) * choose(a, b - 1));
  for (let n = 1; n <= 5; n++)
    for (let h = n; h <= 9; h++) expect(allStates(n, h).length).toBe(choose(h, n));
});

// The identity the whole layout rests on: columns are excitation levels,
// and a throw of height t moves you exactly (t - n) columns.
test("a throw of height t shifts excitation by exactly t - n", () => {
  for (let n = 1; n <= 5; n++)
    for (let h = n; h <= 9; h++)
      for (const s of allStates(n, h))
        for (const { t, to } of throwsFrom(s, h))
          expect(excitation(to, n, h) - excitation(s, n, h), `${stateString(s, h)} --${t}-->`).toBe(
            t - n,
          );
});

test("every state is reachable and has the right out-degree", () => {
  const n = 3;
  const h = 7;
  for (const s of allStates(n, h))
    expect(throwsFrom(s, h).length).toBe(s & 1 ? h - n + 1 : 1);
});

// The pairing the ladder diagram rests on: a state IS a vertical slice of the
// ladder. Throws still airborne across beat k, measured as offsets from k, must
// be exactly the set bits of the state at beat k.
test("arcs crossing beat k are exactly the set bits of the state at k", () => {
  for (const [throws, h] of [
    [[5, 3, 1], 5],
    [[4, 4, 1], 5],
    [[5, 1], 5],
    [[3], 3],
    [[7, 5, 3, 1], 7],
    [[6, 4, 5], 6],
    [[9, 7, 5, 3, 1], 9],
  ] as [number[], number][]) {
    const p = throws.length;
    const walk = walkOf(throws, h);
    const maxT = Math.max(...throws);
    for (let k = 0; k < p * 3; k++) {
      const offsets: number[] = [];
      for (let i = k - maxT; i < k; i++) {
        const t = throws[((i % p) + p) % p]!;
        if (i + t >= k) offsets.push(i + t - k);
      }
      expect(offsets.sort((a, b) => a - b), `beat ${k} of ${throws.join("")}`).toEqual(
        bitsOf(walk[k % p]!, h),
      );
    }
  }
});
