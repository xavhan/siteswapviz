# siteswap-viz

Shows a juggling pattern three ways at once: an animation, a ladder diagram,
and a walk through the state graph of every pattern with the same ball count.

**[siteswap-viz.vercel.app](https://siteswap-viz.vercel.app)**

Try [531](https://siteswap-viz.vercel.app/#p=531),
[97531](https://siteswap-viz.vercel.app/#p=97531),
or [4 balls, height 6](https://siteswap-viz.vercel.app/#n=4&h=6).

Type a siteswap, pick a classic from the list on the right, or click states in
the graph to walk your own. If you get back to the state you started from, the
walk is a valid pattern. The URL carries the state, so any view is a link.

## Develop

```sh
npm install
npm run dev     # vite, localhost:5173
npm test        # vitest
npm run build
```

Vite, TypeScript and Vitest are the only dependencies. `src/siteswap.ts` holds
the whole model (states as bitmasks, throws as shifts) and touches no DOM.

[`CONTEXT.md`](./CONTEXT.md) is the glossary: state, excitation, hole, walk.
`/docs.html` explains the three views to a reader new to siteswap.
