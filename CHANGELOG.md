# Changelog

All notable changes to `@sigx/use`.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). While `@sigx/use` is on a `0.x` line, breaking changes may land in minor releases — they will always be called out here.

## [Unreleased]

### Changed

- **Platform-pack split** (#11): the `@sigx/use/web` subpath is replaced by a separate **`@sigx/use-web`** package that `export * from '@sigx/use'` and adds the web implementations — apps import everything from one package, and platform packs (`@sigx/use-lynx` in the lynx repo, third-party packs) become drop-in equals following the same recipe. `@sigx/use` gains an `./internals` entry (`createBox`, `createDebounce`, `createThrottle`) for pack authors, and is now DOM-free by construction. `@sigx/use-web` peer-depends on `@sigx/use` so apps hold a single copy. (Pre-first-publish restructure — nothing on npm changed.)

### Added

- Initial implementation (#6). Two entries:
  - **`@sigx/use`** (platform-agnostic — web, Lynx, SSR/Node, terminal; statically DOM-free, CI-enforced): `useToggle`, `useCounter`, `usePrevious`, `useCycleList`, `useDebouncedSignal`, `useThrottledSignal`, `watchDebounced`, `watchThrottled`, `useIntervalFn`, `useTimeoutFn`, `useNow`, `createGlobalState`, `createSharedComposable`; public utilities `toValue`, `tryOnScopeDispose`, `tryOnMounted` with the `MaybeSignal<T>`/`ReadSignal<T>`/`ReactiveView<T>`/`Pausable` type vocabulary; type-only cross-platform contracts (`ColorScheme`, `ConnectionType`, `NetworkState`, `WindowSizeState`, `StorageLike`/`StorageLikeAsync`, `UseClipboardReturn`) matching the Lynx shapes so platform implementations share signatures.
  - **`@sigx/use-web`** (the web platform pack: re-exports all of `@sigx/use`, then adds SSR-safe DOM composables — `{ window?, document?, navigator? }` configurable-globals as the SSR and test seam): `useEventListener`, `unrefElement`, `useResizeObserver` → `useElementSize`, `useIntersectionObserver` → `useElementVisibility`, `useMouse`, `useWindowSize`, `useScroll` (window default; writing `x`/`y` scrolls), `useMediaQuery` → `useColorScheme`, `useBreakpoints` (+ `breakpointsTailwind`), `useNetwork`/`useOnline`, `useDocumentVisibility`, `useStorage` (+ `useLocalStorage`/`useSessionStorage` — object mode returns a deep-reactive `Signal<T>` where property mutations auto-persist, with cross-tab sync), `useClipboard`, `useTitle`.
  - Cleanup model: composables register teardown with the active component setup or `effectScope` via reactivity's `onScopeDispose` (core ≥0.11.0) and also return explicit `stop()`/`Pausable` handles for standalone use.
