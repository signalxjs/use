import { isComputed, isSignal, watch } from '@sigx/reactivity';
import type { WatchCallback, WatchHandle, WatchOptions, WatchSource } from '@sigx/reactivity';
import { createDebounce } from '../shared/filters.js';
import { tryOnScopeDispose } from '../shared/scope.js';
import type { MaybeSignal, ReadSignal } from '../shared/types.js';

export interface WatchDebouncedOptions extends WatchOptions {
    /** Debounce window in ms. Default 200. */
    debounce?: MaybeSignal<number>;
    /** Upper bound (ms) between callback runs while the source keeps changing. */
    maxWait?: number;
}

/**
 * `watch` with a debounced callback: bursts of source changes collapse into
 * one callback run carrying the latest value. Returns core's `WatchHandle`
 * shape (callable stop, `.stop()`, `.pause()`, `.resume()`); stopping — or
 * scope disposal — cancels any pending run.
 *
 * The callback's `onCleanup` works as in `watch`: the registered cleanup runs
 * before the next (debounced) invocation and on stop.
 *
 * Platform: everywhere (setTimeout).
 *
 * @example
 * ```ts
 * watchDebounced(query, q => api.search(q), { debounce: 300, maxWait: 2000 });
 * ```
 */
export function watchDebounced<T>(
    source: WatchSource<T> | ReadSignal<T>,
    cb: WatchCallback<T, T | undefined>,
    options: WatchDebouncedOptions = {}
): WatchHandle {
    const { debounce = 200, maxWait, ...watchOptions } = options;
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

    const debounced = createDebounce(
        (value: T, oldValue: T | undefined) => {
            runCleanup();
            cb(value, oldValue, onCleanup);
        },
        debounce,
        { maxWait }
    );

    const handle = watch(normalized, (value, oldValue) => debounced.call(value, oldValue), watchOptions);

    const stop = () => {
        debounced.cancel();
        runCleanup();
        handle.stop();
    };
    // The inner watch registered its own stop with the active scope; the
    // pending timer and user cleanup need the same lifetime.
    tryOnScopeDispose(() => {
        debounced.cancel();
        runCleanup();
    });

    const wrapped = (() => stop()) as WatchHandle;
    wrapped.stop = stop;
    wrapped.pause = () => handle.pause();
    wrapped.resume = () => handle.resume();
    return wrapped;
}
