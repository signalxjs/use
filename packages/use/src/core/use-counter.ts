import { signal } from '@sigx/reactivity';
import type { PrimitiveSignal } from '@sigx/reactivity';

export interface UseCounterOptions {
    min?: number;
    max?: number;
}

export interface UseCounterReturn {
    count: PrimitiveSignal<number>;
    /** Increment by `delta` (default 1), clamped. Returns the new value. */
    inc: (delta?: number) => number;
    /** Decrement by `delta` (default 1), clamped. Returns the new value. */
    dec: (delta?: number) => number;
    /** Set to `value`, clamped. Returns the new value. */
    set: (value: number) => number;
    /** Reset to `value` (default: the initial value), clamped. Returns the new value. */
    reset: (value?: number) => number;
}

/**
 * A numeric counter with clamped mutators. Writing `count.value` directly is
 * allowed but bypasses clamping — the mutators are the clamped path.
 *
 * Platform: everywhere. No cleanup needed.
 *
 * @example
 * ```ts
 * const { count, inc, dec, reset } = useCounter(0, { min: 0, max: 10 });
 * inc();    // 1
 * dec(5);   // clamped to 0
 * reset();  // 0
 * ```
 */
export function useCounter(initial = 0, options: UseCounterOptions = {}): UseCounterReturn {
    const { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = options;
    const clamp = (value: number) => Math.min(max, Math.max(min, value));
    const initialClamped = clamp(initial);
    const count = signal(initialClamped);

    const set = (value: number) => (count.value = clamp(value));
    return {
        count,
        inc: (delta = 1) => set(count.value + delta),
        dec: (delta = 1) => set(count.value - delta),
        set,
        reset: (value = initialClamped) => set(value)
    };
}
