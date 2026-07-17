// ============================================================================
// @sigx/use-web - the web platform pack for @sigx/use
// ============================================================================
// Re-exports the platform-agnostic core, then adds SSR-safe DOM composables:
// apps import EVERYTHING from this one package. Every web function takes
// { window?, document?, navigator? } configurable globals (the SSR seam and
// the test seam) and returns inert initial-value signals on the server,
// attaching nothing.
//
// Other platform packs (@sigx/use-lynx, third-party) follow the same recipe:
// `export * from '@sigx/use'` + implementations of the shared contracts.

// The platform-agnostic core (state, timing, factories, utilities, contracts)
export * from '@sigx/use';

// Configurable globals
export {
    defaultDocument,
    defaultNavigator,
    defaultWindow,
    isClient
} from './configurable.js';
export type {
    ConfigurableDocument,
    ConfigurableNavigator,
    ConfigurableWindow,
    MaybeElement,
    MaybeSignalElement
} from './configurable.js';

// Elements
export { unrefElement } from './unref-element.js';
export { useEventListener } from './use-event-listener.js';
export { useResizeObserver } from './use-resize-observer.js';
export type { UseResizeObserverOptions, UseResizeObserverReturn } from './use-resize-observer.js';
export { useElementSize } from './use-element-size.js';
export { useIntersectionObserver } from './use-intersection-observer.js';
export type {
    UseIntersectionObserverOptions,
    UseIntersectionObserverReturn
} from './use-intersection-observer.js';
export { useElementVisibility } from './use-element-visibility.js';
export type { UseElementVisibilityOptions } from './use-element-visibility.js';

// Sensors
export { useMouse } from './use-mouse.js';
export type { MouseState, UseMouseOptions } from './use-mouse.js';
export { useWindowSize } from './use-window-size.js';
export type { UseWindowSizeOptions } from './use-window-size.js';
export { useScroll } from './use-scroll.js';
export type { ScrollTarget, UseScrollOptions, UseScrollReturn } from './use-scroll.js';
export { useMediaQuery } from './use-media-query.js';
export { useColorScheme } from './use-color-scheme.js';
export type { UseColorSchemeOptions } from './use-color-scheme.js';
export { useNetwork } from './use-network.js';
export type { WebNetworkState } from './use-network.js';
export { useOnline } from './use-online.js';
export { useDocumentVisibility } from './use-document-visibility.js';

// Browser
export { useStorage } from './use-storage.js';
export type { StorageSerializer, UseStorageOptions } from './use-storage.js';
export { useLocalStorage, useSessionStorage } from './use-local-storage.js';
export { useClipboard } from './use-clipboard.js';
export type { UseClipboardOptions } from './use-clipboard.js';
export { useTitle } from './use-title.js';
export type { UseTitleOptions } from './use-title.js';
export { useBreakpoints, breakpointsTailwind } from './use-breakpoints.js';
export type { UseBreakpointsReturn } from './use-breakpoints.js';
