import { signal } from '@sigx/reactivity';
import { tryOnScopeDispose } from '../shared/scope.js';
import { toValue } from '../shared/to-value.js';
import type { MaybeSignal, ReadSignal } from '../shared/types.js';

export interface UseTimeoutFnOptions {
    /** Arm the timer on creation. Default true. */
    immediate?: boolean;
}

export interface UseTimeoutFnReturn<A extends unknown[]> {
    /** True while a run is armed and hasn't fired. */
    isPending: ReadSignal<boolean>;
    /** (Re)arm the timer, replacing any pending run. Arguments pass through to `cb`. */
    start: (...args: A) => void;
    /** Cancel the pending run, if any. */
    stop: () => void;
}

/**
 * A restartable one-shot timer: `cb` fires once, `ms` (default 1000) after
 * the latest `start()`. Auto-cancelled when the owning scope disposes.
 *
 * Platform: everywhere (setTimeout).
 *
 * @example
 * ```ts
 * const { start, isPending } = useTimeoutFn(() => (toast.value = null), 3000);
 * start();
 * ```
 */
export function useTimeoutFn<A extends unknown[] = []>(
    cb: (...args: A) => void,
    ms: MaybeSignal<number> = 1000,
    options: UseTimeoutFnOptions = {}
): UseTimeoutFnReturn<A> {
    const { immediate = true } = options;
    const isPending = signal(false);
    let timer: ReturnType<typeof setTimeout> | null = null;

    function clear() {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
    }
    function stop() {
        isPending.value = false;
        clear();
    }
    function start(...args: A) {
        clear();
        isPending.value = true;
        timer = setTimeout(() => {
            isPending.value = false;
            timer = null;
            cb(...args);
        }, toValue(ms));
    }

    if (immediate) (start as () => void)();
    tryOnScopeDispose(stop);

    return { isPending, start, stop };
}
