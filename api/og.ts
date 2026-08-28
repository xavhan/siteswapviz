import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import { FONT, ogSvg, OG_H, OG_W } from "../src/og.js";
import { MAX_HEIGHT, parsePattern, validate } from "../src/siteswap.js";

// what a link with no pattern in it shows: the site's own shape, under its name
const FALLBACK = { throws: [5, 3, 1], caption: "MARCEL NOIR" };

// The rasteriser has no system fonts to fall back on, so ship the one the
// picture asks for. vercel.json keeps the file next to the bundled function.
const font = fileURLToPath(new URL("./assets/mono.ttf", import.meta.url));

/** The pattern in ?p=, or the fallback when there isn't a usable one. */
function patternOf(url: URL): { throws: number[]; caption?: string } {
  const parsed = parsePattern(url.searchParams.get("p") ?? "");
  if (!parsed || !validate(parsed).ok) return FALLBACK;
  return Math.max(...parsed) > MAX_HEIGHT ? FALLBACK : { throws: parsed };
}

export function GET(request: Request): Response {
  const { throws, caption } = patternOf(new URL(request.url));
  const svg = ogSvg(throws, OG_W, OG_H, caption);
  const png = new Resvg(svg, {
    font: { fontFiles: [font], defaultFontFamily: FONT.split(",")[0], loadSystemFonts: false },
  })
    .render()
    .asPng();

  return new Response(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      // the picture is a pure function of ?p=, so it never needs revalidating
      "cache-control": "public, max-age=3600, s-maxage=31536000, immutable",
    },
  });
}
