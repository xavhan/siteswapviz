import { expect, test } from "vitest";
import { beatCount } from "./ladder";

const period = (p: number) => Array.from({ length: p }, () => 3);

test("the ladder window is always a whole number of periods", () => {
  for (let p = 1; p <= 20; p++) expect(beatCount(period(p), true) % p).toBe(0);
});

test("it shows a few beats without running away", () => {
  for (let p = 1; p <= 8; p++) {
    const beats = beatCount(period(p), true);
    expect(beats).toBeGreaterThanOrEqual(Math.min(7, p));
    expect(beats).toBeLessThanOrEqual(16);
  }
  expect(beatCount(period(3), true)).toBe(9);
  expect(beatCount(period(5), true)).toBe(10);
});

test("an open walk is drawn exactly as far as it goes", () => {
  expect(beatCount(period(4), false)).toBe(4);
});
