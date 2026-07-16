import { untrack, watch } from '@sigx/reactivity';
import { createBox } from '../shared/box.js';
import { createDebounce } from '../shared/filters.js';
import { tryOnScopeDispose } from '../shared/scope.js';
import { toValue } from '../shared/to-value.js';
import type { MaybeSignal, ReadSignal } from '../shared/types.js';

export interface UseDebouncedSignalOptions {
    /** Upper bound (ms) between updates while the source keeps changing. */
    maxWait?: number;
}

/**
 * A read-only signal trailing `source` by `ms` (default 200), collapsing
 * bursts of changes into one update. Any pending update is cancelled when
 * the owning scope disposes.
 *
 * Platform: everywhere (setTimeout).
 *
 * @example
 * ```ts
 * const query = signal('');
 * const debounced = useDebouncedSignal(query, 300);
 * watch(debounced, q => search(q));
 * ```
 */
export function useDebouncedSignal<T>(
    source: MaybeSignal<T>,
    ms: MaybeSignal<number> = 200,
    options: UseDebouncedSignalOptions = {}
): ReadSignal<T> {
    const state = createBox(untrack(() => toValue(source)));
    const debounced = createDebounce((value: T) => state.set(value), ms, options);
    watch(
        () => toValue(source),
        (value) => debounced.call(value)
    );
    tryOnScopeDispose(debounced.cancel);
    return state.read;
}
