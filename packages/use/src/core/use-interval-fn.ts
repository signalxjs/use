import { signal, watch } from '@sigx/reactivity';
import { tryOnScopeDispose } from '../shared/scope.js';
import { toValue } from '../shared/to-value.js';
import type { MaybeSignal, Pausable } from '../shared/types.js';

export interface UseIntervalFnOptions {
    /** Start the timer on creation. Default true. */
    immediate?: boolean;
    /** Also invoke `cb` right away whenever the timer (re)starts. Default false. */
    immediateCallback?: boolean;
}

/**
 * Run `cb` every `interval` ms (default 1000). A reactive `interval`
 * restarts the running timer when it changes. The timer clears automatically
 * with the owning scope; `pause()`/`resume()` control it manually.
 *
 * Platform: everywhere (setInterval).
 *
 * @example
 * ```ts
 * const { pause, resume, isActive } = useIntervalFn(() => tick(), 1000);
 * pause();
 * ```
 */
export function useIntervalFn(
    cb: () => void,
    interval: MaybeSignal<number> = 1000,
    options: UseIntervalFnOptions = {}
): Pausable {
    const { immediate = true, immediateCallback = false } = options;
    const isActive = signal(false);
    let timer: ReturnType<typeof setInterval> | null = null;

    function clean() {
        if (timer !== null) {
            clearInterval(timer);
            timer = null;
        }
    }
    function pause() {
        isActive.value = false;
        clean();
    }
    function resume() {
        const ms = toValue(interval);
        // A non-positive interval disables the timer entirely: clear any
        // running timer and report inactive. It stays paused until resume()
        // is called after the interval becomes positive again.
        if (ms <= 0) {
            pause();
            return;
        }
        isActive.value = true;
        clean();
        if (immediateCallback) cb();
        timer = setInterval(cb, ms);
    }

    // Restart on reactive interval changes (plain numbers never change).
    if (typeof interval === 'function' || typeof interval === 'object') {
        watch(
            () => toValue(interval),
            () => {
                if (isActive.value) resume();
            }
        );
    }

    if (immediate) resume();
    tryOnScopeDispose(pause);

    return { isActive, pause, resume };
}
