import { computed, signal } from '@sigx/reactivity';
import type { Computed } from '@sigx/reactivity';

/**
 * Internal: a change-tracked box holding `T` by reference — no deep proxying,
 * no identity change (a `Date` or DOM element goes in and comes out as-is).
 * `read` is a real `Computed`, so consumers can feed it back into any
 * `MaybeSignal`-taking API and `toValue()` unwraps it.
 *
 * The generic-safe alternative to `signal(value)` (whose overloads split on
 * primitive vs object) for composable-internal state.
 */
export interface Box<T> {
    read: Computed<T>;
    set: (value: T) => void;
    /** Read without tracking. */
    peek: () => T;
}

export function createBox<T>(initial: T): Box<T> {
    let current = initial;
    const version = signal(0);
    const read = computed(() => {
        // oxlint-disable-next-line no-unused-expressions -- subscribes the computed to version
        version.value;
        return current;
    });
    return {
        read,
        set(value: T) {
            if (Object.is(value, current)) return;
            current = value;
            version.value++;
        },
        peek: () => current
    };
}
