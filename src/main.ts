import { renderSvg, wireHover } from "./graph";
import { beatCount, renderLadder } from "./ladder";
import { buildStage, type Stage } from "./juggler";
import { buildGraph, type Graph } from "./layout";
import {
  ground,
  parsePattern,
  patternString,
  stateOf,
  throwsFrom,
  validate,
  walkOf,
  type State,
} from "./siteswap";

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

const MAX_H = 9;

let n = 3;
let h = 5;
let graph: Graph = buildGraph(n, h);
let walk: State[] = [];
let throws: number[] = [];
let beat: number | null = null; // ladder cursor, also the animation's current beat
let stage: Stage | null = null;
let stageKey = "";
let playing = false;
let raf = 0;
let originMs = 0;
let originBeat = 0;
let lastWhole = -1;

const beatMs = () => 820 - Number(tempoEl.value); // slider right = faster

function draw() {
  nEl.value = String(n);
  hEl.value = String(h);
  hEl.min = String(n);
  const closed = walk.length > 1 && walk[0] === walk[walk.length - 1];
  const focus =
    beat === null || !throws.length ? null : closed ? walk[beat % throws.length]! : walk[beat]!;

  graphEl.innerHTML = renderSvg({ graph, h, walk, throws, focus });
  const svg = graphEl.querySelector("svg")!;
  wireHover(svg);
  svg.addEventListener("click", onClick);

  ladderEl.innerHTML = renderLadder({ throws, walk, h, closed, cursor: beat });
  syncStage(closed);

  readoutEl.textContent = !walk.length
    ? `${graph.nodes.size} states · ${graph.edges.length} throws · click a state to start walking`
    : closed
      ? `${patternString(throws)} — closed cycle, period ${throws.length}`
      : `${patternString(throws) || "—"} — open walk · ${throwsFrom(walk[walk.length - 1]!, h).length} throws from here`;
  readoutEl.className = closed ? "closed" : "";
}

function say(text: string, bad = false) {
  msgEl.textContent = text;
  msgEl.className = bad ? "bad" : "";
  patEl.setAttribute("aria-invalid", String(bad)); // brute draws this as a dashed border
}

function rebuild() {
  graph = buildGraph(n, h);
}

function onClick(ev: Event) {
  const g = (ev.target as Element).closest(".node") as SVGGElement | null;
  if (!g) return;
  const s = Number(g.dataset.state);

  if (!walk.length) {
    walk = [s];
    throws = [];
  } else {
    const last = walk[walk.length - 1]!;
    const hop = throwsFrom(last, h).find((e) => e.to === s);
    if (hop) {
      walk.push(s);
      throws.push(hop.t);
    } else {
      walk = [s]; // unreachable in one throw: start over there
      throws = [];
    }
  }

  beat = null;
  const closed = walk.length > 1 && walk[0] === walk[walk.length - 1];
  patEl.value = closed ? patternString(throws) : "";
  say(closed ? `${patternString(throws)} closes here` : "");
  draw();
}

function onPattern() {
  const raw = patEl.value;
  if (!raw.trim()) {
    walk = [];
    throws = [];
    say("");
    return draw();
  }

  const parsed = parsePattern(raw);
  if (!parsed) return say("can't read that — digits, or letters a=10, b=11…", true);

  const check = validate(parsed);
  if (!check.ok) return say(check.error, true);

  const maxT = Math.max(...parsed);
  if (maxT > MAX_H) return say(`throw ${maxT} is above the ${MAX_H} height cap`, true);
  if (check.balls < 1) return say("no balls in that pattern", true);

  const notes: string[] = [];
  if (check.balls !== n) {
    n = check.balls;
    notes.push(`balls → ${n}`);
  }
  if (maxT > h) {
    h = maxT;
    notes.push(`max height → ${h}`);
  }
  if (h < n) h = n;
  rebuild();

  walk = walkOf(parsed, h);
  throws = parsed;
  beat = null;
  const excited = stateOf(parsed, h) !== ground(n);
  say(
    [`valid · ${check.balls} balls · period ${parsed.length}`, excited ? "excited state" : "ground state", ...notes]
      .join(" · "),
  );
  draw();
}

function onDims() {
  const nextN = Math.max(1, Math.min(MAX_H, Number(nEl.value) || 1));
  const nextH = Math.max(nextN, Math.min(MAX_H, Number(hEl.value) || nextN));
  if (nextN === n && nextH === h) return;
  n = nextN;
  h = nextH;
  rebuild();
  // keep the walk only if every state still exists at this size
  if (!walk.every((s) => graph.nodes.has(s))) {
    walk = [];
    throws = [];
    patEl.value = "";
    say("");
  }
  draw();
}

/** Rebuild the stage only when the pattern itself changes — draw() runs every beat. */
function syncStage(closed: boolean) {
  // an open walk is not periodic, so looping it would animate throws that collide
  // the box is viewport-driven, so its height is part of the identity
  const boxH = Math.max(240, Math.round(stageEl.clientHeight));
  const key = closed ? `${throws.join(",")}@${boxH}` : "";
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
  stage = buildStage(throws, throws.reduce((a, b) => a + b, 0) / throws.length, boxH);
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
    beat = whole % beatCount(throws, true); // keep the other two views on the same beat
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
  typing = window.setTimeout(onPattern, 180);
});
nEl.addEventListener("change", onDims);
hEl.addEventListener("change", onDims);
$("clear").addEventListener("click", () => {
  walk = [];
  throws = [];
  patEl.value = "";
  say("");
  draw();
});

patEl.value = "531";
onPattern();
