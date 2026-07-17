// ============================================================================
// @sigx/use - Public API (platform-agnostic root entry)
// ============================================================================
// Everything here works on web, Lynx (native), SSR/Node and terminal.
// Nothing in this graph may reference DOM globals or DOM types — enforced by
// `pnpm typecheck:core`. Browser composables live in the `@sigx/use-web` platform pack.

// Shared utilities
export { toValue } from './shared/to-value.js';
export { tryOnScopeDispose } from './shared/scope.js';
export { tryOnMounted } from './shared/lifecycle.js';
export type { MaybeSignal, Pausable, ReactiveView, ReadSignal, Stop } from './shared/types.js';

// Cross-platform contracts (type-only)
export type {
    ColorScheme,
    ConnectionType,
    NetworkState,
    StorageLike,
    StorageLikeAsync,
    UseClipboardReturn,
    WindowSizeState
} from './contracts.js';

// State
export { useToggle } from './core/use-toggle.js';
export type { Toggler } from './core/use-toggle.js';
export { useCounter } from './core/use-counter.js';
export type { UseCounterOptions, UseCounterReturn } from './core/use-counter.js';
export { usePrevious } from './core/use-previous.js';
export { useCycleList } from './core/use-cycle-list.js';
export type { UseCycleListOptions, UseCycleListReturn } from './core/use-cycle-list.js';

// Signal transformers
export { useDebouncedSignal } from './core/use-debounced-signal.js';
export type { UseDebouncedSignalOptions } from './core/use-debounced-signal.js';
export { useThrottledSignal } from './core/use-throttled-signal.js';
export type { UseThrottledSignalOptions } from './core/use-throttled-signal.js';

// Watch wrappers
export { watchDebounced } from './core/watch-debounced.js';
export type { WatchDebouncedOptions } from './core/watch-debounced.js';
export { watchThrottled } from './core/watch-throttled.js';
export type { WatchThrottledOptions } from './core/watch-throttled.js';

// Timing
export { useIntervalFn } from './core/use-interval-fn.js';
export type { UseIntervalFnOptions } from './core/use-interval-fn.js';
export { useTimeoutFn } from './core/use-timeout-fn.js';
export type { UseTimeoutFnOptions, UseTimeoutFnReturn } from './core/use-timeout-fn.js';
export { useNow } from './core/use-now.js';
export type { UseNowOptions } from './core/use-now.js';

// Factories
export { createGlobalState } from './core/create-global-state.js';
export { createSharedComposable } from './core/create-shared-composable.js';
