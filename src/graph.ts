import type { Graph } from "./layout";
import { stateString, throwChar, throwsFrom, type State } from "./siteswap";

export type View = {
  graph: Graph;
  h: number;
  walk: State[];
  throws: number[];
  focus: State | null;
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export function renderSvg({ graph, h, walk, throws, focus }: View): string {
  // edges on the walk, keyed by "from>t" so repeated states keep their own throw
  const hot = new Set<string>();
  for (let i = 0; i < throws.length; i++) hot.add(`${walk[i]}>${throws[i]}`);
  const onWalk = new Set(walk);

  // While a walk is open, its last state is the cursor: show every throw
  // available from there. A closed walk is finished, so it gets no options.
  const closed = walk.length > 1 && walk[0] === walk[walk.length - 1];
  const cursor = walk.length && !closed ? walk[walk.length - 1]! : null;
  const nextEdge = new Set<string>();
  const nextNode = new Set<State>();
  if (cursor !== null)
    for (const { t, to } of throwsFrom(cursor, h)) {
      nextEdge.add(`${cursor}>${t}`);
      nextNode.add(to);
    }

  const edges = graph.edges
    .map((e) => {
      const key = `${e.from}>${e.t}`;
      const tier = hot.has(key) ? " hot" : nextEdge.has(key) ? " next" : "";
      return `<path class="edge${tier}" d="${e.d}" data-from="${e.from}" data-t="${e.t}" /><text class="elabel${tier}" x="${e.lx}" y="${e.ly}" data-from="${e.from}">${throwChar(e.t)}</text>`;
    })
    .join("");

  const { nodeW, nodeH } = graph;
  const nodes = [...graph.nodes.values()]
    .map((nd) => {
      const cls = [
        "node",
        onWalk.has(nd.s) ? "on" : "",
        walk[0] === nd.s && walk.length ? "start" : "",
        nextNode.has(nd.s) ? "next" : "",
        cursor === nd.s ? "cursor" : "",
        focus === nd.s ? "focus" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<g class="${cls}" data-state="${nd.s}" transform="translate(${nd.x} ${nd.y})">
        <rect class="halo" x="${-nodeW / 2 - 4}" y="${-nodeH / 2 - 4}" width="${nodeW + 8}" height="${nodeH + 8}" />
        <rect class="box" x="${-nodeW / 2}" y="${-nodeH / 2}" width="${nodeW}" height="${nodeH}" />
        <text>${esc(stateString(nd.s, h))}</text>
      </g>`;
    })
    .join("");

  const ticks = graph.levels
    .map(({ e, y }) => `<text class="tick" x="10" y="${y}">${e === 0 ? "ground" : `+${e}`}</text>`)
    .join("");

  return `<svg viewBox="0 0 ${graph.width} ${graph.height}" width="${graph.width}" height="${graph.height}"
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label="siteswap state graph">
    <defs>
      <marker id="arrow" viewBox="0 0 8 8" refX="7.5" refY="4" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M0 0 L8 4 L0 8 z" fill="context-stroke" />
      </marker>
      <!-- brute's hatch hover, as an SVG fill: background-image cannot reach a <rect>.
           1px stripe, 6px period, 45deg — the same numbers as the CSS idiom. -->
      <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="6" height="6" fill="#ffffff" />
        <line x1="0" y1="0" x2="0" y2="6" stroke="#e8e8e8" stroke-width="1" />
      </pattern>
      <pattern id="hatch-inv" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="6" height="6" fill="#000000" />
        <line x1="0" y1="0" x2="0" y2="6" stroke="#ffffff" stroke-width="1" />
      </pattern>
    </defs>
    <g class="edges">${edges}</g>${ticks}<g class="nodes">${nodes}</g>
  </svg>`;
}

/** Dim everything except the hovered state's own throws. No re-render. */
export function wireHover(svg: SVGSVGElement): void {
  const set = (from: string | null) => {
    svg.classList.toggle("hovering", from !== null);
    for (const el of svg.querySelectorAll<SVGElement>(".edge, .elabel"))
      el.classList.toggle("lit", from !== null && el.dataset.from === from);
  };
  for (const g of svg.querySelectorAll<SVGGElement>(".node")) {
    g.addEventListener("mouseenter", () => set(g.dataset.state!));
    g.addEventListener("mouseleave", () => set(null));
  }
}
