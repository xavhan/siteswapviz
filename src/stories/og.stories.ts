import type { Meta, StoryObj } from "@storybook/html-vite";
import { OG_H, OG_W, ogSvg, ogText } from "../og";
import { ground, parsePattern, stateOf, validate, MAX_HEIGHT } from "../siteswap";
import { cell, el, grid, PATTERNS } from "./helpers";

/** What a link to this pattern looks like when it is pasted somewhere. */
function preview(pattern: string): HTMLElement {
  const throws = parsePattern(pattern) ?? [3];
  const check = validate(throws);
  const box = el("div", { border: "2px solid #000", maxWidth: "620px", background: "#fff" });

  const img = el("div", { lineHeight: "0", borderBottom: "2px solid #000" });
  img.innerHTML = ogSvg(throws, OG_W, OG_H).replace("<svg ", '<svg style="width:100%;height:auto" ');

  const words = el("div", { padding: "12px 14px", font: "13px/1.45 ui-monospace, monospace" });
  const { title, description } = check.ok
    ? ogText(pattern, check.balls, throws.length, stateOf(throws, MAX_HEIGHT) !== ground(check.balls))
    : { title: "invalid", description: "" };
  const t = el("div", { fontWeight: "700" });
  t.textContent = title;
  const d = el("div", { color: "#666", marginTop: "4px" });
  d.textContent = description;
  const host = el("div", { color: "#999", marginTop: "8px", fontSize: "11px" });
  host.textContent = `siteswap-viz.vercel.app/p/${pattern}`;
  words.append(t, d, host);

  box.append(img, words);
  return box;
}

const meta: Meta = {
  title: "Link preview/OG image",
  parameters: { layout: "padded" },
};
export default meta;

/** One pattern, drawn exactly as /api/og renders it. Edit the pattern below. */
export const Single: StoryObj = {
  args: { pattern: "531" },
  argTypes: { pattern: { control: "text" } },
  render: ({ pattern }) => preview(String(pattern)),
};

/** The whole classics list, to check the fit holds from a 3 up to a 9. */
export const EveryClassic: StoryObj = {
  render: () => {
    const g = grid("380px");
    for (const p of PATTERNS) {
      const svg = ogSvg(parsePattern(p)!, OG_W, OG_H).replace(
        "<svg ",
        '<svg style="width:100%;height:auto;display:block" ',
      );
      g.appendChild(cell(p, svg));
    }
    return g;
  },
};

/** Extremes: the shortest pattern, the tallest throw, holes, a long period. */
export const EdgeCases: StoryObj = {
  render: () => {
    const g = grid("380px");
    for (const [p, why] of [
      ["1", "period 1, a single hand-across"],
      ["9", "the height cap"],
      ["50505", "holes on every other beat"],
      ["531531531", "period 9"],
      ["66661", "5 balls, nearly flat"],
    ] as [string, string][]) {
      const svg = ogSvg(parsePattern(p)!, OG_W, OG_H).replace(
        "<svg ",
        '<svg style="width:100%;height:auto;display:block" ',
      );
      g.appendChild(cell(`${p} — ${why}`, svg));
    }
    return g;
  },
};
