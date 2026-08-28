import { buildGraph, type Graph } from "./layout";
import {
  MAX_HEIGHT,
  ground,
  parsePattern,
  patternString,
  stateOf,
  throwsFrom,
  validate,
  walkOf,
  type State,
} from "./siteswap";

/** Everything the three views and the URL need, derived once. */
export type WalkView = {
  n: number;
  h: number;
  graph: Graph;
  states: State[];
  throws: number[];
  closed: boolean;
  /** The pattern when the walk closes, otherwise "" — an open walk has no notation. */
  pattern: string;
  /** The throws made so far, closed or not. */
  sequence: string;
  /** How many throws lead out of the state the walk currently ends on. */
  exits: number;
  period: number;
  message: string;
  bad: boolean;
  hash: string;
  /** The state the walk sits in at beat b, wrapping when it is closed. */
  stateAtBeat: (b: number) => State | null;
};

export type Walk = ReturnType<typeof createWalk>;

/**
 * The walk being shown, and the rules that change it. Knows nothing about the
 * DOM: every entry point takes plain values and every answer comes back through
 * view().
 */
export function createWalk(n = 3, h = 5) {
  let graph = buildGraph(n, h);
  let states: State[] = [];
  let throws: number[] = [];
  let message = "";
  let bad = false;

  const isClosed = () => states.length > 1 && states[0] === states[states.length - 1];

  const say = (text: string, isBad = false) => {
    message = text;
    bad = isBad;
  };

  const clear = () => {
    states = [];
    throws = [];
    say("");
  };

  const stateAtBeat = (b: number): State | null => {
    if (!states.length || !throws.length) return null;
    return (isClosed() ? states[b % throws.length] : states[b]) ?? null;
  };

  const view = (): WalkView => {
    const closed = isClosed();
    const sequence = patternString(throws);
    const end = states.length ? states[states.length - 1]! : null;
    return {
      n,
      h,
      graph,
      states,
      throws,
      closed,
      pattern: closed ? sequence : "",
      sequence,
      exits: end === null ? 0 : throwsFrom(end, h).length,
      period: throws.length,
      message,
      bad,
      hash: closed ? `p=${sequence}` : `n=${n}&h=${h}`,
      stateAtBeat,
    };
  };

  /** Read a siteswap. Anything unreadable leaves the current walk alone. */
  const setPattern = (raw: string) => {
    if (!raw.trim()) return clear();

    const parsed = parsePattern(raw);
    if (!parsed) return say("can't read that — digits, or letters a=10, b=11…", true);

    const check = validate(parsed);
    if (!check.ok) return say(check.error, true);

    const maxT = Math.max(...parsed);
    if (maxT > MAX_HEIGHT) return say(`throw ${maxT} is above the ${MAX_HEIGHT} height cap`, true);
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
    graph = buildGraph(n, h);

    states = walkOf(parsed, h);
    throws = parsed;
    const excited = stateOf(parsed, h) !== ground(n);
    say(
      [
        `valid · ${check.balls} balls · period ${parsed.length}`,
        excited ? "excited state" : "ground state",
        ...notes,
      ].join(" · "),
    );
  };

  /** Walk to a state by clicking it. Unreachable in one throw: start over there. */
  const stepTo = (s: State) => {
    const last = states.length ? states[states.length - 1]! : null;
    const hop = last === null ? undefined : throwsFrom(last, h).find((e) => e.to === s);
    if (hop) {
      states.push(s);
      throws.push(hop.t);
    } else {
      states = [s];
      throws = [];
    }
    say(isClosed() ? `${patternString(throws)} closes here` : "");
  };

  const setDims = (nextN: number, nextH: number) => {
    n = Math.max(1, Math.min(MAX_HEIGHT, nextN || 1));
    h = Math.max(n, Math.min(MAX_HEIGHT, nextH || n));
    graph = buildGraph(n, h);
    // keep the walk only if every state still exists at this size
    if (!states.every((s) => graph.nodes.has(s))) clear();
  };

  /** Apply a "#p=531" or "#n=4&h=6" hash. Returns the pattern text it read. */
  const applyHash = (hash: string): string => {
    const q = new URLSearchParams(hash.replace(/^#/, ""));
    const qn = Number(q.get("n")) || 0;
    if (qn) setDims(qn, Number(q.get("h")) || qn);
    const raw = q.get("p") ?? (hash ? "" : "531");
    setPattern(raw);
    return raw;
  };

  return { view, setPattern, stepTo, setDims, clear, applyHash };
}
