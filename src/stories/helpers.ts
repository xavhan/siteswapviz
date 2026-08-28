import { createWalk, type WalkView } from "../walk";

/** A walk sitting on a pattern, ready to hand to any of the three renderers. */
export const viewOf = (pattern: string): WalkView => {
  const w = createWalk();
  w.setPattern(pattern);
  return w.view();
};

export const el = (tag: string, css: Partial<CSSStyleDeclaration> = {}): HTMLElement => {
  const node = document.createElement(tag);
  Object.assign(node.style, css);
  return node;
};

/** A labelled cell, so a grid of patterns says which is which. */
export function cell(label: string, body: string | Node): HTMLElement {
  const box = el("figure", { margin: "0 0 24px", minWidth: "0" });
  const cap = el("figcaption", {
    font: "700 10px/1 ui-monospace, monospace",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    padding: "6px 0",
  });
  cap.textContent = label;
  const frame = el("div", {
    border: "2px solid #000",
    overflow: "auto",
    background: "#fff",
    width: "fit-content",
    maxWidth: "100%",
  });
  if (typeof body === "string") frame.innerHTML = body;
  else frame.appendChild(body);
  box.append(cap, frame);
  return box;
}

export function grid(min = "320px"): HTMLElement {
  return el("div", {
    display: "grid",
    gridTemplateColumns: `repeat(auto-fill, minmax(${min}, 1fr))`,
    gap: "20px",
    font: "12px ui-monospace, monospace",
  });
}

/** The classics, as the app lists them. */
export const PATTERNS = [
  "3",
  "441",
  "531",
  "51",
  "423",
  "50505",
  "55500",
  "4",
  "552",
  "633",
  "7531",
  "5",
  "744",
  "97531",
  "9",
];
