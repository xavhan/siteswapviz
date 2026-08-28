import { expect, test } from "vitest";
import { createWalk } from "./walk";
import { walkOf } from "./siteswap";

test("a valid pattern closes and names itself", () => {
  const w = createWalk();
  w.setPattern("531");
  const v = w.view();
  expect(v.closed).toBe(true);
  expect(v.pattern).toBe("531");
  expect(v.period).toBe(3);
  expect(v.url).toBe("/p/531");
  expect(v.message).toContain("ground state");
});

test("a pattern adopts the balls and height it needs", () => {
  const w = createWalk();
  w.setPattern("97531");
  const v = w.view();
  expect([v.n, v.h]).toEqual([5, 9]);
  expect(v.message).toContain("balls → 5");
  expect(v.graph.nodes.has(v.states[0]!)).toBe(true);
});

test("an unreadable or invalid pattern leaves the walk alone", () => {
  const w = createWalk();
  w.setPattern("531");
  for (const bad of ["5-1", "521", "532", "a1"]) {
    w.setPattern(bad);
    expect(w.view().bad).toBe(true);
    expect(w.view().pattern).toBe("531"); // still showing the last good one
  }
});

test("walking state by state records the throws and closes on return", () => {
  const w = createWalk();
  const states = walkOf([5, 3, 1], 5); // [ground, ..., ground]
  for (const s of states) w.stepTo(s);
  const v = w.view();
  expect(v.throws).toEqual([5, 3, 1]);
  expect(v.closed).toBe(true);
  expect(v.pattern).toBe("531");
});

test("stepping somewhere unreachable starts a new walk there", () => {
  const w = createWalk();
  const [ground, after5] = walkOf([5, 3, 1], 5);
  w.stepTo(ground!);
  w.stepTo(after5!);
  expect(w.view().throws).toEqual([5]);
  w.stepTo(ground!); // not reachable from after5 in one throw
  expect(w.view().throws).toEqual([]);
  expect(w.view().states).toEqual([ground]);
});

test("resizing drops a walk whose states no longer exist", () => {
  const w = createWalk();
  w.setPattern("531");
  w.setDims(4, 6);
  const v = w.view();
  expect(v.states).toEqual([]);
  expect(v.pattern).toBe("");
  expect(v.url).toBe("/?n=4&h=6");
});

test("height is clamped to the ball count and the cap", () => {
  const w = createWalk();
  w.setDims(5, 2);
  expect(w.view().h).toBe(5);
  w.setDims(99, 99);
  expect(w.view()).toMatchObject({ n: 9, h: 9 });
});

test("urls round-trip, path or query or hash", () => {
  const w = createWalk();
  expect(w.applyUrl("/p/441")).toBe("441");
  expect(w.view().url).toBe("/p/441");

  expect(w.applyUrl("?p=531")).toBe("531");
  expect(w.applyUrl("#p=531")).toBe("531");

  w.applyUrl("/?n=4&h=6");
  expect(w.view()).toMatchObject({ n: 4, h: 6, pattern: "" });
  expect(w.view().url).toBe("/?n=4&h=6");

  w.applyUrl(""); // nothing in the url at all: the default pattern
  expect(w.view().pattern).toBe("531");
});

test("a closed walk repeats forever, an open one runs out", () => {
  const w = createWalk();
  w.setPattern("531");
  const at0 = w.view().stateAtBeat(0);
  expect(w.view().stateAtBeat(3)).toBe(at0);
  expect(w.view().stateAtBeat(6)).toBe(at0);

  w.clear();
  expect(w.view().stateAtBeat(0)).toBeNull();
});
