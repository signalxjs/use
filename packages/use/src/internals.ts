// ============================================================================
// @sigx/use/internals - implementation helpers for platform packs
// ============================================================================
// Not part of the stable public API. Exposed (house pattern, like
// @sigx/reactivity/internals) so platform packages — @sigx/use-web,
// @sigx/use-lynx, third-party packs — build their composables on the same
// primitives instead of copying them. May change between minor versions.

export { createBox } from './shared/box.js';
export type { Box } from './shared/box.js';
export { createDebounce, createThrottle } from './shared/filters.js';
export type { DebounceOptions, RateLimited, ThrottleOptions } from './shared/filters.js';
