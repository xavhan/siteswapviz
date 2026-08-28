import { expect, test } from "vitest";
import { label, ogSvg } from "./og";

const arcs = (svg: string) => (svg.match(/<polyline/g) ?? []).length;

test("one parabola per distinct path, holes drawn as nothing", () => {
  // a cascade is one throw each way, and nothing else
  expect(arcs(ogSvg([3]))).toBe(2);
  expect(arcs(ogSvg([4]))).toBe(2);
  // 531: a 5, a 3 and a 1, each in both directions
  expect(arcs(ogSvg([5, 3, 1]))).toBe(6);
  // every 5 in 50505 flies the same two paths
  expect(arcs(ogSvg([5, 0, 5, 0, 5]))).toBe(2);
  expect(arcs(ogSvg([0]))).toBe(0);
});

test("the drawing stays inside the frame", () => {
  for (const throws of [[1], [9], [5, 3, 1], [9, 7, 5, 3, 1], [4]]) {
    const svg = ogSvg(throws);
    const [, dx, dy, s] = svg.match(/translate\((-?[\d.]+) ([\d.]+)\) scale\(([\d.]+)\)/)!;
    expect(Number(dx)).toBeGreaterThanOrEqual(60);
    expect(Number(dy)).toBeLessThanOrEqual(630 - 60);
    expect(Number(s)).toBeGreaterThan(0);
  }
});

test("the pattern is written under the line, cut when it is long", () => {
  expect(ogSvg([5, 3, 1])).toContain(">531</text>");
  expect(label("531")).toBe("531");
  expect(label("531531531531")).toBe("531531531531"); // 12 fits
  expect(label("5315315315315")).toBe("53153153153…");
  expect(label("5315315315315").length).toBe(12);
});
