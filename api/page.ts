import { ogText } from "../src/og.js";
import {
  MAX_HEIGHT,
  ground,
  parsePattern,
  patternString,
  stateOf,
  validate,
} from "../src/siteswap.js";

/**
 * Serves the app with link-preview tags for the pattern in ?p=. The page itself
 * is the static build: this only rewrites what lives in <head>, because a
 * crawler never runs the app and never sees the pattern otherwise.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const page = await fetch(new URL("/index.html", url));
  const html = await page.text();

  const meta = tagsFor(url);
  // the static defaults would otherwise sit alongside the pattern's own tags
  const head = meta
    ? html.replace(/[ \t]*<meta (?:property="og:|name="twitter:)[^>]*>\n?/g, "")
    : html;

  return new Response(meta ? head.replace("</head>", `${meta}\n  </head>`) : html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

const attr = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function tagsFor(url: URL): string {
  const raw = url.searchParams.get("p") ?? "";
  const throws = parsePattern(raw);
  if (!throws) return "";

  const check = validate(throws);
  if (!check.ok || Math.max(...throws) > MAX_HEIGHT) return "";

  const pattern = patternString(throws);
  const { title, description } = ogText(
    pattern,
    check.balls,
    throws.length,
    stateOf(throws, MAX_HEIGHT) !== ground(check.balls),
  );
  const image = new URL(`/api/og?p=${encodeURIComponent(pattern)}`, url).toString();
  const page = new URL(`/p/${encodeURIComponent(pattern)}`, url).toString();

  return [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${attr(page)}" />`,
    `<meta property="og:title" content="${attr(title)}" />`,
    `<meta property="og:description" content="${attr(description)}" />`,
    `<meta property="og:image" content="${attr(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${attr(title)}" />`,
    `<meta name="twitter:description" content="${attr(description)}" />`,
    `<meta name="twitter:image" content="${attr(image)}" />`,
  ]
    .map((tag) => `  ${tag}`)
    .join("\n");
}
