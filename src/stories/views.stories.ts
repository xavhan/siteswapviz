import type { Meta, StoryObj } from "@storybook/html-vite";
import { renderSvg, wireHover } from "../graph";
import { buildStage } from "../juggler";
import { renderLadder } from "../ladder";
import { createWalk } from "../walk";
import { cell, el, grid, PATTERNS, viewOf } from "./helpers";

const meta: Meta = {
  title: "Views",
  parameters: { layout: "padded" },
};
export default meta;

/** The state graph for one pattern, hover and all. */
export const StateGraph: StoryObj = {
  args: { pattern: "531" },
  argTypes: { pattern: { control: "text" } },
  render: ({ pattern }) => {
    const host = el("div", { overflow: "auto", maxHeight: "80vh" });
    host.innerHTML = renderSvg(viewOf(String(pattern)), null);
    wireHover(host.querySelector("svg")!);
    return host;
  },
};

/** Graph size against balls and height: this is what gets slow first. */
export const GraphSizes: StoryObj = {
  render: () => {
    const g = grid("300px");
    for (const [n, h] of [
      [3, 5],
      [3, 7],
      [4, 6],
      [5, 7],
      [5, 9],
    ] as [number, number][]) {
      const w = createWalk();
      w.setDims(n, h);
      const v = w.view();
      const host = el("div", { maxHeight: "420px", overflow: "auto" });
      host.innerHTML = renderSvg(v, null);
      g.appendChild(cell(`${n} balls, height ${h} — ${v.graph.nodes.size} states, ${v.graph.edges.length} throws`, host));
    }
    return g;
  },
};

/** The ladder at every beat of the pattern, so the cursor can be checked. */
export const LadderAtEachBeat: StoryObj = {
  args: { pattern: "531" },
  argTypes: { pattern: { control: "text" } },
  render: ({ pattern }) => {
    const v = viewOf(String(pattern));
    const col = el("div", { display: "grid", gap: "16px", font: "12px ui-monospace, monospace" });
    col.appendChild(cell("no cursor", renderLadder(v, null)));
    for (let b = 0; b < Math.min(v.period, 9); b++) col.appendChild(cell(`cursor on beat ${b}`, renderLadder(v, b)));
    return col;
  },
};

/** Every classic as a ladder, for spotting arcs that cross the wrong way. */
export const EveryLadder: StoryObj = {
  render: () => {
    const g = grid("460px");
    for (const p of PATTERNS) g.appendChild(cell(p, renderLadder(viewOf(p), null)));
    return g;
  },
};

/** The animation, running. Scrub with the beat control or let it play. */
export const Animation: StoryObj = {
  args: { pattern: "531", playing: true, beat: 0 },
  argTypes: {
    pattern: { control: "text" },
    playing: { control: "boolean" },
    beat: { control: { type: "range", min: 0, max: 16, step: 0.05 } },
  },
  render: ({ pattern, playing, beat }) => {
    const host = el("div", { width: "380px", height: "420px", border: "2px solid #000" });
    const stage = buildStage(viewOf(String(pattern)), 420);
    host.appendChild(stage.el);

    if (!playing) stage.update(Number(beat));
    else {
      const start = performance.now();
      const tick = (now: number) => {
        if (!host.isConnected) return; // the story was swapped out
        stage.update((now - start) / 320);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    return host;
  },
};

/** All three views of one pattern, side by side, as the page shows them. */
export const AllThree: StoryObj = {
  args: { pattern: "441" },
  argTypes: { pattern: { control: "text" } },
  render: ({ pattern }) => {
    const v = viewOf(String(pattern));
    const wrap = el("div", { display: "grid", gap: "20px", font: "12px ui-monospace, monospace" });

    const stageHost = el("div", { width: "380px", height: "300px" });
    const stage = buildStage(v, 300);
    stageHost.appendChild(stage.el);
    stage.update(0);

    const graphHost = el("div", { maxHeight: "420px", overflow: "auto" });
    graphHost.innerHTML = renderSvg(v, v.stateAtBeat(0));

    wrap.append(
      cell("animation, beat 0", stageHost),
      cell("ladder", renderLadder(v, 0)),
      cell("state graph", graphHost),
    );
    return wrap;
  },
};
