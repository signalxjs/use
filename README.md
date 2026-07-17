<div align="center">

# @sigx/use

**Composable utilities for [SignalX](https://sigx.dev/core/) — tree-shakable functions built on sigx signals.**

[![npm](https://img.shields.io/npm/v/@sigx/use.svg?label=@sigx/use&color=blue)](https://www.npmjs.com/package/@sigx/use)
[![npm](https://img.shields.io/npm/v/@sigx/use-web.svg?label=@sigx/use-web&color=blue)](https://www.npmjs.com/package/@sigx/use-web)
[![license](https://img.shields.io/npm/l/@sigx/use.svg)](./LICENSE)
[![ci](https://github.com/signalxjs/use/actions/workflows/ci.yml/badge.svg)](https://github.com/signalxjs/use/actions/workflows/ci.yml)
[![types](https://img.shields.io/npm/types/@sigx/use.svg)](https://www.typescriptlang.org/)

</div>

> 🚧 SignalX is in early public release. The API surface is small and stabilising — feedback is very welcome.

## What is @sigx/use?

The SignalX equivalent of [VueUse](https://vueuse.org): a curated collection of
composable functions — state helpers, timing utilities, browser sensors,
storage, clipboard and more — each one a small, tree-shakable function built on
`@sigx/reactivity` signals. Import only what you use; your bundle contains only
what you import.

Two packages, split by **where the code can run** — a platform-pack
architecture (the same packs-on-a-seam pattern core uses for hydration
strategies and cache):

- **`@sigx/use`** — the seam: platform-agnostic composables + the shared type
  contracts. Works on web, [Lynx](https://sigx.dev/lynx/) (native iOS/Android),
  SSR/Node, and terminal. Statically DOM-free (CI-enforced).
- **`@sigx/use-web`** — the web platform pack. **Re-exports all of
  `@sigx/use`** and adds SSR-safe browser composables, so apps import
  everything from one package. Inert defaults on the server; everything
  detaches when the owning component or `effectScope` is disposed.
- **`@sigx/use-lynx`** *(planned, lives in the lynx repo)* — the native pack:
  same recipe, implementing the same contract names over native bridges.

Cross-platform concepts (`useColorScheme`, `useOnline`, `useStorage`, …) share
type contracts exported from `@sigx/use`, so every platform pack has identical
signatures — app code written against them ports by swapping (or aliasing) one
package.

### Writing your own platform pack

```ts
// @sigx/use-yourplatform/src/index.ts
export * from '@sigx/use';                    // 1. re-export the seam
export { useColorScheme } from './use-color-scheme.js'; // 2. implement the contracts
// Shared implementation helpers (createBox, createDebounce, createThrottle)
// are available from '@sigx/use/internals'.
```

Declare `@sigx/use` as a **peerDependency** so apps hold a single copy.

## A taste

```tsx
import { component, signal } from 'sigx';
// One import source: @sigx/use-web re-exports the platform-agnostic core.
import {
  useDebouncedSignal, useToggle,               // from the @sigx/use core
  useLocalStorage, useMouse, useMediaQuery     // web implementations
} from '@sigx/use-web';

const Demo = component(() => {
  // Deep-reactive object persisted to localStorage — mutations auto-save.
  const prefs = useLocalStorage('prefs', { theme: 'light', fontSize: 14 });

  const mouse = useMouse();                       // reactive { x, y }
  const isWide = useMediaQuery('(min-width: 1024px)');
  const [showHints, toggleHints] = useToggle(true);

  const query = signal('');
  const debounced = useDebouncedSignal(query, 300);

  // Everything above cleans up automatically when the component unmounts.
  return () => (
    <main data-theme={prefs.theme}>
      <p>{mouse.x}, {mouse.y} — {isWide.value ? 'desktop' : 'compact'}</p>
      <button onClick={() => toggleHints()}>hints: {String(showHints.value)}</button>
    </main>
  );
});
```

## Install

```bash
npm install @sigx/use-web   # web apps — includes everything from @sigx/use
npm install @sigx/use       # libraries / non-web platforms — the seam only
```

> Both packages declare `@sigx/reactivity` and `@sigx/runtime-core` as peer
> dependencies (`>=0.11.0 <0.12.0`), and `@sigx/use-web` peers on `@sigx/use`,
> so your app holds a single copy of everything. Package managers that
> auto-install peers (npm 7+, pnpm with `auto-install-peers`) need nothing
> more; otherwise install the peers explicitly.

## Functions

### `@sigx/use` — everywhere (web, Lynx, SSR, terminal); re-exported by every platform pack

| Category | Functions |
|---|---|
| State | `useToggle`, `useCounter`, `usePrevious`, `useCycleList` |
| Signals | `useDebouncedSignal`, `useThrottledSignal` |
| Watch | `watchDebounced`, `watchThrottled` |
| Timing | `useIntervalFn`, `useTimeoutFn`, `useNow` |
| Factories | `createGlobalState`, `createSharedComposable` |
| Utilities | `toValue`, `tryOnScopeDispose`, `tryOnMounted`, `MaybeSignal` |

### `@sigx/use-web` — browser (SSR-safe), adds:

| Category | Functions |
|---|---|
| Elements | `useEventListener`, `useResizeObserver`, `useElementSize`, `useIntersectionObserver`, `useElementVisibility`, `unrefElement` |
| Sensors | `useMouse`, `useWindowSize`, `useScroll`, `useMediaQuery`, `useColorScheme`, `useNetwork`, `useOnline`, `useDocumentVisibility` |
| Browser | `useStorage`, `useLocalStorage`, `useSessionStorage`, `useClipboard`, `useTitle`, `useBreakpoints` |

Deliberately **not** here (already owned elsewhere in SignalX):
value-first async data → [`useData`/`useAction`](https://sigx.dev/core/) in core;
URL query params → [`useQuery`](https://sigx.dev/router/) in the router;
SSR-rendered head/title management → `useHead` in core (use `useTitle` for
dynamic client-side titles).

## 📚 Documentation

Full guides, per-function API reference and live examples → **<https://sigx.dev/use/>**

## Part of SignalX

| Project | Description |
|---|---|
| [Core](https://sigx.dev/core/) | Signals, reactivity, components |
| [Store](https://sigx.dev/store/) | Centralized state management |
| [Router](https://sigx.dev/router/) | Type-safe routing with SSR support |
| [SSG](https://sigx.dev/ssg/) | Static site generation |
| [Lynx](https://sigx.dev/lynx/) | Native iOS/Android apps |

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). Agent workflow and repo conventions
live in [`AGENTS.md`](./AGENTS.md).

## License

[MIT](./LICENSE) © Andreas Ekdahl
