import { watch } from '@sigx/reactivity';
import { createBox } from '../shared/box.js';
import { toValue } from '../shared/to-value.js';
import type { MaybeSignal, ReadSignal } from '../shared/types.js';

/**
 * The value `source` held *before* its latest change (lag-by-one).
 * Holds `initialValue` (default `undefined`) until the first change.
 *
 * Values are kept by reference — objects are not proxied, identity is
 * preserved. The internal watcher disposes with the owning scope.
 *
 * Platform: everywhere.
 *
 * @example
 * ```ts
 * const count = signal(0);
 * const prev = usePrevious(count); // prev.value === undefined
 * count.value = 5;                 // prev.value === 0
 * ```
 */
export function usePrevious<T>(source: MaybeSignal<T>, initialValue?: T): ReadSignal<T | undefined> {
    const previous = createBox<T | undefined>(initialValue);
    watch(
        () => toValue(source),
        (_value, oldValue) => previous.set(oldValue)
    );
    return previous.read;
}
