import { renderSvg, wireHover } from "./graph";
import { beatCount, renderLadder } from "./ladder";
import { buildStage, type Stage } from "./juggler";
import { MAX_HEIGHT } from "./siteswap";
import { createWalk, type WalkView } from "./walk";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const nEl = $<HTMLInputElement>("n");
const hEl = $<HTMLInputElement>("h");
const patEl = $<HTMLInputElement>("pattern");
const msgEl = $("msg");
const graphEl = $("graph");
const ladderEl = $("ladder");
const stageEl = $("stage");
const playEl = $<HTMLButtonElement>("play");
const tempoEl = $<HTMLInputElement>("tempo");
const readoutEl = $("readout");
const presetsEl = $("presets");

const walk = createWalk();
nEl.max = hEl.max = String(MAX_HEIGHT);

let beat: number | null = null; // ladder cursor, also the animation's current beat
let stage: Stage | null = null;
let stageKey = "";
let playing = false;
let raf = 0;
let originMs = 0;
let originBeat = 0;
let lastWhole = -1;
let shownUrl = "";

const beatMs = () => 820 - Number(tempoEl.value); // slider right = faster

function draw() {
  const v = walk.view();
  nEl.value = String(v.n);
  hEl.value = String(v.h);
  hEl.min = String(v.n);

  msgEl.textContent = v.message;
  msgEl.className = v.bad ? "bad" : "";
  patEl.setAttribute("aria-invalid", String(v.bad)); // brute draws this as a dashed border

  graphEl.innerHTML = renderSvg(v, beat === null ? null : v.stateAtBeat(beat));
  const svg = graphEl.querySelector("svg")!;
  wireHover(svg);
  svg.addEventListener("click", onClick);

  ladderEl.innerHTML = renderLadder(v, beat);
  syncStage(v);

  readoutEl.textContent = !v.states.length
    ? `${v.graph.nodes.size} states · ${v.graph.edges.length} throws · click a state to start walking`
    : v.closed
      ? `${v.pattern} — closed walk, period ${v.period}`
      : `${v.sequence || "—"} — open walk · ${v.exits} throws from here`;
  readoutEl.className = v.closed ? "closed" : "";

  // guarded: draw() runs every animation beat, and browsers throttle replaceState
  if (v.url !== shownUrl) {
    shownUrl = v.url;
    // a path, not a hash: only what reaches the server can be given a link
    // preview, and /p/531 is where the preview tags are served from
    history.replaceState(null, "", v.url);
    for (const b of presetsEl.querySelectorAll("button"))
      b.setAttribute("aria-pressed", String(b.dataset.p === v.pattern));
  }
}

function onClick(ev: Event) {
  const g = (ev.target as Element).closest(".node") as SVGGElement | null;
  if (!g) return;
  walk.stepTo(Number(g.dataset.state));
  beat = null;
  patEl.value = walk.view().pattern;
  draw();
}

/** Well-known patterns, by ball count. Nothing above height 9 — that is the cap. */
const CLASSICS: [string, [string, string][]][] = [
  ["3 balls", [
    ["3", "cascade"],
    ["423", "one up two up"],
    ["441", ""],
    ["531", ""],
    ["51", "shower"],
    ["45141", ""],
    ["50505", "columns"],
    ["55500", ""],
    ["4413", ""],
  ]],
  ["4 balls", [
    ["4", "fountain"],
    ["71", "shower"],
    ["552", ""],
    ["633", "half box"],
    ["534", ""],
    ["5551", ""],
    ["7531", ""],
    ["5344", ""],
  ]],
  ["5 balls", [
    ["5", "cascade"],
    ["744", ""],
    ["645", ""],
    ["97531", ""],
    ["66661", ""],
  ]],
  ["6+ balls", [
    ["6", "fountain"],
    ["7", "cascade"],
    ["8", "fountain"],
    ["9", "cascade"],
  ]],
];

presetsEl.innerHTML = CLASSICS.map(
  ([group, items]) =>
    `<h3>${group}</h3>` +
    items
      .map(([p, name]) => `<button type="button" data-p="${p}">${p}${name ? ` <small>${name}</small>` : ""}</button>`)
      .join(""),
).join("");

presetsEl.addEventListener("click", (ev) => {
  const p = (ev.target as Element).closest("button")?.dataset.p;
  if (!p) return;
  patEl.value = p;
  walk.setPattern(p);
  beat = null;
  draw();
});

/** Rebuild the stage only when the pattern itself changes — draw() runs every beat. */
function syncStage(v: WalkView) {
  // an open walk is not periodic, so looping it would animate throws that collide
  // the box is viewport-driven, so its height is part of the identity
  const boxH = Math.max(240, Math.round(stageEl.clientHeight));
  const key = v.closed ? `${v.throws.join(",")}@${boxH}` : "";
  if (key === stageKey) return;
  stageKey = key;
  stageEl.innerHTML = "";
  stage = null;
  if (!key) {
    stop();
    playEl.disabled = true;
    return;
  }
  playEl.disabled = false;
  stage = buildStage(v, boxH);
  stageEl.appendChild(stage.el);
  if (beat !== null) stage.update(beat);
}

function frame(now: number) {
  if (!playing || !stage) return;
  const at = originBeat + (now - originMs) / beatMs();
  stage.update(at);
  const whole = Math.floor(at);
  if (whole !== lastWhole) {
    lastWhole = whole;
    // the ladder window is the loop length; it is a whole number of periods,
    // so wrapping on it keeps the cursor, the graph and the balls on one beat
    beat = whole % beatCount(walk.view().throws, true);
    draw();
  }
  raf = requestAnimationFrame(frame);
}

function stop() {
  playing = false;
  cancelAnimationFrame(raf);
  playEl.textContent = "play";
}

playEl.addEventListener("click", () => {
  if (playing || !stage) return stop();
  playing = true;
  playEl.textContent = "pause";
  originBeat = beat ?? 0;
  originMs = performance.now();
  lastWhole = -1;
  raf = requestAnimationFrame(frame);
});
tempoEl.addEventListener("input", () => {
  if (!playing) return;
  originBeat = beat ?? 0; // re-anchor so the change does not jump the pattern
  originMs = performance.now();
});

// delegated: #ladder survives redraws, so per-element listeners would pile up
ladderEl.addEventListener("mouseover", (ev) => {
  if (playing) return;
  const b = (ev.target as Element).getAttribute("data-beat");
  if (b === null || Number(b) === beat) return;
  beat = Number(b);
  stage?.update(beat); // scrub the animation to the hovered beat
  draw();
});
ladderEl.addEventListener("mouseleave", () => {
  if (playing || beat === null) return;
  beat = null;
  draw();
});

let resizing = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizing);
  resizing = window.setTimeout(draw, 150); // the stage is sized from the viewport
});

// Typing "97531" passes through 9, 8, 7 and 6 balls on the way, each a whole
// different graph. Settle before relaying out.
let typing = 0;
patEl.addEventListener("input", () => {
  clearTimeout(typing);
  typing = window.setTimeout(() => {
    walk.setPattern(patEl.value);
    beat = null;
    draw();
  }, 180);
});

const onDims = () => {
  walk.setDims(Number(nEl.value), Number(hEl.value));
  patEl.value = walk.view().pattern;
  beat = null;
  draw();
};
nEl.addEventListener("change", onDims);
hEl.addEventListener("change", onDims);

$("clear").addEventListener("click", () => {
  walk.clear();
  patEl.value = "";
  beat = null;
  draw();
});

const load = () => {
  patEl.value = walk.applyUrl(location.pathname + location.search + location.hash);
  beat = null;
  draw();
};
window.addEventListener("hashchange", load);
load();
