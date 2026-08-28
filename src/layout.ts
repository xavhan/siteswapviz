import { allStates, bitsOf, excitation, throwsFrom, type State } from "./siteswap";

export type Node = { s: State; x: number; y: number; e: number };
export type Edge = { from: State; to: State; t: number; d: string; lx: number; ly: number };
export type Level = { e: number; y: number };
export type Graph = {
  nodes: Map<State, Node>;
  edges: Edge[];
  levels: Level[];
  width: number;
  height: number;
  nodeW: number;
  nodeH: number;
};

// Excitation is the long axis (13 levels at n=3,h=7 against 5 states per level),
// so it runs down the page: the graph ends up roughly square and scrolls the way
// a page normally does.
const LEVEL_GAP = 54;
const SLOT_PAD = 30;
const PAD_X = 104; // left margin holds the level ticks and self-loops
const PAD_Y = 40;
const NODE_H = 24;
export const CHAR_W = 7.9; // 13px monospace

/** Within a level, order by how far into the future the state is committed. */
const spread = (s: State, h: number) => Math.max(...bitsOf(s, h));

export function buildGraph(n: number, h: number): Graph {
  const nodeW = h * CHAR_W + 18;
  const slotW = nodeW + SLOT_PAD;

  const byLevel = new Map<number, State[]>();
  for (const s of allStates(n, h)) {
    const e = excitation(s, n, h);
    const at = byLevel.get(e);
    if (at) at.push(s);
    else byLevel.set(e, [s]);
  }

  const order = [...byLevel.keys()].sort((a, b) => a - b);
  const widest = Math.max(...order.map((e) => byLevel.get(e)!.length));
  const contentW = widest * nodeW + (widest - 1) * SLOT_PAD;
  const width = PAD_X + contentW + PAD_Y;
  const height = (order.length - 1) * LEVEL_GAP + NODE_H + 2 * PAD_Y;
  const midX = PAD_X + contentW / 2;

  const nodes = new Map<State, Node>();
  const levels: Level[] = [];
  order.forEach((e, row) => {
    const members = byLevel
      .get(e)!
      .sort((a, b) => spread(a, h) - spread(b, h) || a - b);
    const y = PAD_Y + NODE_H / 2 + row * LEVEL_GAP;
    levels.push({ e, y });
    members.forEach((s, i) => {
      nodes.set(s, { s, e, x: midX + (i - (members.length - 1) / 2) * slotW, y });
    });
  });

  const edges: Edge[] = [];
  for (const from of nodes.values())
    for (const { t, to } of throwsFrom(from.s, h))
      edges.push(curve(from, nodes.get(to)!, t, n, nodeW));

  return { nodes, edges, levels, width, height, nodeW, nodeH: NODE_H };
}

function curve(a: Node, b: Node, t: number, n: number, nodeW: number): Edge {
  if (a.s === b.s) {
    const left = a.x - nodeW / 2;
    return {
      from: a.s,
      to: b.s,
      t,
      d: `M ${left} ${a.y - 7} C ${left - 48} ${a.y - 27}, ${left - 48} ${a.y + 27}, ${left} ${a.y + 7}`,
      lx: left - 30,
      ly: a.y,
    };
  }

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;

  // The bulge is absolute, never perpendicular to travel: a perpendicular flips
  // with direction, so a->b and b->a would share one channel and hide a label.
  let cx: number;
  let cy: number;
  if (dy === 0) {
    // same level, so t === n both ways: separate the directions by state order
    cx = mx;
    cy = my + Math.max(46, Math.abs(dx) * 0.3) * (a.s < b.s ? 1 : -1);
  } else {
    // crossing levels means t !== n, so this splits the two directions for free
    cx = mx + Math.min(Math.hypot(dx, dy) * 0.26, 96) * (t > n ? 1 : -1);
    cy = my;
  }

  const [sx, sy] = onBox(a, cx, cy, nodeW);
  const [ex, ey] = onBox(b, cx, cy, nodeW);
  return {
    from: a.s,
    to: b.s,
    t,
    d: `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`,
    // same-level curves are short and their apex lands in the arrowhead
    // cluster, so push those labels out to the control point instead
    lx: dy === 0 ? cx : 0.25 * sx + 0.5 * cx + 0.25 * ex,
    ly: dy === 0 ? cy : 0.25 * sy + 0.5 * cy + 0.25 * ey,
  };
}

/** Where the ray from a node's centre toward (tx,ty) leaves its box, plus a small gap. */
function onBox(node: Node, tx: number, ty: number, nodeW: number): [number, number] {
  const dx = tx - node.x;
  const dy = ty - node.y;
  const sx = dx === 0 ? Infinity : nodeW / 2 / Math.abs(dx);
  const sy = dy === 0 ? Infinity : NODE_H / 2 / Math.abs(dy);
  const k = Math.min(sx, sy);
  const len = Math.hypot(dx * k, dy * k) + 5;
  const unit = Math.hypot(dx, dy);
  return [node.x + (dx / unit) * len, node.y + (dy / unit) * len];
}
