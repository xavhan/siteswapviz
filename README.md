# Marcel noir

A siteswap visualiser for people wearing black tank-tops.

**[marcel-noir.vercel.app](https://marcel-noir.vercel.app)**

Try [531](https://marcel-noir.vercel.app/p/531),
[97531](https://marcel-noir.vercel.app/p/97531),
or [4 balls, height 6](https://marcel-noir.vercel.app/?n=4&h=6).

For now:

- Juggler
- Ladder graph
- State graph

You can also use state graph to create a siteswap sequence by composing its excitation states.

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

[`CONTEXT.md`](./CONTEXT.md) is the glossary: state, excitation, hole, walk.
`/docs.html` explains the three views to a reader new to siteswap.
