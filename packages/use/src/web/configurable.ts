// ============================================================================
// Configurable globals - the SSR seam and the test seam of @sigx/use/web
// ============================================================================
// Every web composable takes { window?, document?, navigator? } and falls
// back to these defaults. On the server the defaults are undefined and the
// composable returns inert initial-value signals, attaching nothing. Tests
// inject mocks through the same options.

import type { MaybeSignal } from '../shared/types.js';

export const isClient = typeof window !== 'undefined' && typeof document !== 'undefined';

export const defaultWindow: Window | undefined = isClient ? window : undefined;
export const defaultDocument: Document | undefined = isClient ? window.document : undefined;
export const defaultNavigator: Navigator | undefined = isClient ? window.navigator : undefined;

export interface ConfigurableWindow {
    window?: Window;
}
export interface ConfigurableDocument {
    document?: Document;
}
export interface ConfigurableNavigator {
    navigator?: Navigator;
}

export type MaybeElement = HTMLElement | SVGElement | Element | null | undefined;

/**
 * The element-target convention: a raw element, a template-ref object
 * (`signal({ current: null as HTMLElement | null })` — the shape sigx's JSX
 * `ref` prop writes into), a `{ value }` signal/computed, or a getter.
 * Composables resolve it reactively via `unrefElement` and re-attach when
 * the element changes.
 */
export type MaybeSignalElement<T extends MaybeElement = MaybeElement> =
    | MaybeSignal<T>
    | { current: T };

export const noop = (): void => {};
