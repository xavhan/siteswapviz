# siteswap-viz

Read a juggling pattern three ways at once: as an animation, as a ladder
diagram, and as a walk through the state graph of every pattern with the same
ball count.

**[siteswap-viz.vercel.app](https://siteswap-viz.vercel.app)** —
try [531](https://siteswap-viz.vercel.app/#p=531),
[97531](https://siteswap-viz.vercel.app/#p=97531),
or [4 balls, height 6](https://siteswap-viz.vercel.app/#n=4&h=6).

Type a siteswap, pick a classic from the right, or click states in the graph to
walk your own — get back to the start and you have invented a valid pattern.
The URL carries the state, so any view is a link.

## Develop

```sh
npm install
npm run dev     # vite, localhost:5173
npm test        # vitest
npm run build
```

No dependencies beyond Vite, TypeScript and Vitest. `src/siteswap.ts` is the
whole model — states as bitmasks, throws as shifts — and has no DOM in it.

[`CONTEXT.md`](./CONTEXT.md) is the glossary: state, excitation, hole, walk.
`/docs.html` explains the three views to a reader who has never seen siteswap.
