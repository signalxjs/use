import { computed, untrack } from '@sigx/reactivity';
import { createBox } from '../shared/box.js';
import { toValue } from '../shared/to-value.js';
import type { MaybeSignal, ReadSignal } from '../shared/types.js';

export interface UseCycleListOptions<T> {
    /** Starting value. Default: the list item at `fallbackIndex`. */
    initialValue?: T;
    /** Index used when the current value is not in the (possibly changed) list. Default 0. */
    fallbackIndex?: number;
}

export interface UseCycleListReturn<T> {
    /**
     * The current item. Falls back to `fallbackIndex` if the list no longer
     * contains it; an empty list keeps the last known value.
     */
    state: ReadSignal<T>;
    /** Index of the current item in the list (-1 while the list is empty). */
    index: ReadSignal<number>;
    /** Advance `n` steps (default 1), wrapping around. Returns the new item. */
    next: (n?: number) => T;
    /** Go back `n` steps (default 1), wrapping around. Returns the new item. */
    prev: (n?: number) => T;
    /** Jump to `index` (wrapped into range). Returns the new item. */
    go: (index: number) => T;
}

/**
 * Cycle through a (possibly reactive) list with wrap-around.
 *
 * Platform: everywhere. No cleanup needed.
 *
 * @example
 * ```ts
 * const { state, next, prev } = useCycleList(['light', 'dark', 'system']);
 * next(); // state.value === 'dark'
 * prev(); // 'light'
 * ```
 */
export function useCycleList<T>(
    list: MaybeSignal<T[]>,
    options: UseCycleListOptions<T> = {}
): UseCycleListReturn<T> {
    const fallbackIndex = options.fallbackIndex ?? 0;
    const listRead = computed(() => toValue(list));

    const initial =
        options.initialValue !== undefined
            ? options.initialValue
            : untrack(() => listRead.value[fallbackIndex]);
    const current = createBox<T>(initial);

    const state = computed(() => {
        const value = current.read.value;
        const items = listRead.value;
        // Empty list: keep the last known value rather than yielding undefined.
        if (items.length === 0) return value;
        return items.includes(value) ? value : items[Math.min(fallbackIndex, items.length - 1)];
    });
    const index = computed(() => listRead.value.indexOf(state.value));

    function go(target: number): T {
        const items = untrack(() => listRead.value);
        if (items.length === 0) return current.peek(); // nothing to cycle
        const wrapped = ((target % items.length) + items.length) % items.length;
        const value = items[wrapped];
        current.set(value);
        return value;
    }

    return {
        state,
        index,
        next: (n = 1) => go(untrack(() => index.value) + n),
        prev: (n = 1) => go(untrack(() => index.value) - n),
        go
    };
}
