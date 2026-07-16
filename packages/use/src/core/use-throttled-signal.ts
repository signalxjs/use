import { untrack, watch } from '@sigx/reactivity';
import { createBox } from '../shared/box.js';
import { createThrottle } from '../shared/filters.js';
import { tryOnScopeDispose } from '../shared/scope.js';
import { toValue } from '../shared/to-value.js';
import type { MaybeSignal, ReadSignal } from '../shared/types.js';
import type { ThrottleOptions } from '../shared/filters.js';

export type UseThrottledSignalOptions = ThrottleOptions;

/**
 * A read-only signal that follows `source` at most once per `ms`
 * (default 200). `leading` (default true) updates on the first change of a
 * window; `trailing` (default true) delivers the last change of a window.
 * Any pending update is cancelled when the owning scope disposes.
 *
 * Platform: everywhere (setTimeout).
 *
 * @example
 * ```ts
 * const throttled = useThrottledSignal(() => scroll.y.value, 100);
 * ```
 */
export function useThrottledSignal<T>(
    source: MaybeSignal<T>,
    ms: MaybeSignal<number> = 200,
    options: UseThrottledSignalOptions = {}
): ReadSignal<T> {
    const state = createBox(untrack(() => toValue(source)));
    const throttled = createThrottle((value: T) => state.set(value), ms, options);
    watch(
        () => toValue(source),
        (value) => throttled.call(value)
    );
    tryOnScopeDispose(throttled.cancel);
    return state.read;
}
