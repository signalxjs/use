import { isComputed, isSignal, toRaw } from '@sigx/reactivity';
import type { ReadSignal } from '../shared/types.js';
import type { MaybeSignalElement } from './configurable.js';

/**
 * Resolve an element target to the RAW element (or null): accepts a plain
 * element/EventTarget, a getter, a branded sigx handle (primitive signal,
 * computed, or `toSignal`/`toSignals` view — detected via `isSignal`/
 * `isComputed`, so an arbitrary plain `{ value }` object is NOT unwrapped;
 * pass those as getters), or a sigx template-ref `{ current }` object.
 * Reading a reactive handle tracks, so watchers re-run when the element
 * changes.
 *
 * The result is passed through `toRaw` — reactive object-signal reads wrap
 * elements in proxies, and raw identity is required for `removeEventListener`
 * pairing, observer bookkeeping, and native methods.
 *
 * @example
 * ```ts
 * const ref = signal({ current: null as HTMLElement | null }); // JSX ref
 * useEventListener(ref, 'click', onClick);
 * ```
 */
export function unrefElement<T extends EventTarget = EventTarget>(
    target:
        | MaybeSignalElement
        | T
        | ReadSignal<T | null | undefined>
        | { current: T | null | undefined }
        | (() => T | null | undefined)
        | null
        | undefined
): T | null {
    let resolved: unknown = target;
    if (typeof resolved === 'function') {
        resolved = (resolved as () => unknown)();
    } else if (resolved !== null && typeof resolved === 'object') {
        if (isSignal(resolved) || isComputed(resolved)) {
            resolved = (resolved as { value: unknown }).value;
        } else if (
            typeof (resolved as EventTarget).addEventListener !== 'function' &&
            'current' in (resolved as object)
        ) {
            resolved = (resolved as { current: unknown }).current;
        }
    }
    if (resolved === null || resolved === undefined) return null;
    return toRaw(resolved) as T;
}
