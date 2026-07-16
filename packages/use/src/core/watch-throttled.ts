import { isComputed, isSignal, watch } from '@sigx/reactivity';
import type { WatchCallback, WatchHandle, WatchOptions, WatchSource } from '@sigx/reactivity';
import { createThrottle } from '../shared/filters.js';
import { tryOnScopeDispose } from '../shared/scope.js';
import type { MaybeSignal, ReadSignal } from '../shared/types.js';

export interface WatchThrottledOptions extends WatchOptions {
    /** Throttle window in ms. Default 200. */
    throttle?: MaybeSignal<number>;
    /** Run on the leading edge of the window. Default true. */
    leading?: boolean;
    /** Run the latest pending change on the trailing edge. Default true. */
    trailing?: boolean;
}

/**
 * `watch` with a throttled callback: runs at most once per `throttle` ms,
 * always with the latest value. Returns core's `WatchHandle` shape; stopping —
 * or scope disposal — cancels any pending trailing run.
 *
 * Platform: everywhere (setTimeout).
 *
 * @example
 * ```ts
 * watchThrottled(scrollY, y => updateMinimap(y), { throttle: 100 });
 * ```
 */
export function watchThrottled<T>(
    source: WatchSource<T> | ReadSignal<T>,
    cb: WatchCallback<T, T | undefined>,
    options: WatchThrottledOptions = {}
): WatchHandle {
    const { throttle = 200, leading, trailing, ...watchOptions } = options;
    // Core watch treats a signal-shaped object as the value itself; unwrap
    // primitive signals/computeds to a tracked getter.
    const normalized: WatchSource<T> =
        isSignal(source) || isComputed(source)
            ? () => (source as ReadSignal<T>).value
            : (source as WatchSource<T>);

    let cleanupFn: (() => void) | undefined;
    const onCleanup = (fn: () => void) => {
        cleanupFn = fn;
    };
    const runCleanup = () => {
        if (cleanupFn) {
            const fn = cleanupFn;
            cleanupFn = undefined;
            fn();
        }
    };

    const throttled = createThrottle(
        (value: T, oldValue: T | undefined) => {
            runCleanup();
            cb(value, oldValue, onCleanup);
        },
        throttle,
        { leading, trailing }
    );

    const handle = watch(normalized, (value, oldValue) => throttled.call(value, oldValue), watchOptions);

    const stop = () => {
        throttled.cancel();
        runCleanup();
        handle.stop();
    };
    tryOnScopeDispose(() => {
        throttled.cancel();
        runCleanup();
    });

    const wrapped = (() => stop()) as WatchHandle;
    wrapped.stop = stop;
    wrapped.pause = () => handle.pause();
    wrapped.resume = () => handle.resume();
    return wrapped;
}
