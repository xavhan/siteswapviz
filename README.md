# Marcel noir

Shows a juggling pattern three ways at once: an animation, a ladder diagram,
and a walk through the state graph of every pattern with the same ball count.

**[marcel-noir.vercel.app](https://marcel-noir.vercel.app)**

Try [531](https://marcel-noir.vercel.app/p/531),
[97531](https://marcel-noir.vercel.app/p/97531),
or [4 balls, height 6](https://marcel-noir.vercel.app/?n=4&h=6).

Type a siteswap, pick a classic from the list on the right, or click states in
the graph to walk your own. If you get back to the state you started from, the
walk is a valid pattern. The URL carries the state, so any view is a link.

## Develop

```sh
npm install
npm run dev        # vite, localhost:5173
npm test           # vitest
npm run storybook  # every view across every classic, localhost:6006
npm run build
```

`src/siteswap.ts` holds the whole model (states as bitmasks, throws as shifts)
and touches no DOM. `src/walk.ts` is the app state: what pattern is loaded, what
the URL says, what the three views draw. Only the PNG rasteriser ships to
production as a dependency; Vite, Vitest and Storybook are dev-only.

## Link previews

`/p/531` serves the app with preview tags for that pattern, and `/api/og?p=531`
draws the pattern as a 1200x630 PNG: the paths its throws fly, one parabola
each, no hands and no balls, with the pattern on a plate in the middle.
Both run as Vercel functions in `api/`, which is also where the font the
rasteriser needs lives. The app writes `/p/531` into the address bar, so any URL
you copy has a preview. Hash and query forms still load.

[`CONTEXT.md`](./CONTEXT.md) is the glossary: state, excitation, hole, walk.
`/docs.html` explains the three views to a reader new to siteswap.
