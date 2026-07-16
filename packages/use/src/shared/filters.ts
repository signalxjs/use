// Internal debounce/throttle engine shared by useDebouncedSignal,
// useThrottledSignal, watchDebounced and watchThrottled. Not exported.
import { toValue } from './to-value.js';
import type { MaybeSignal } from './types.js';

export interface RateLimited<A extends unknown[]> {
    call: (...args: A) => void;
    /** Drop any pending invocation without running it. */
    cancel: () => void;
}

export interface DebounceOptions {
    /** Upper bound (ms) between invocations while calls keep arriving. */
    maxWait?: number;
}

export function createDebounce<A extends unknown[]>(
    fn: (...args: A) => void,
    ms: MaybeSignal<number>,
    options: DebounceOptions = {}
): RateLimited<A> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let maxTimer: ReturnType<typeof setTimeout> | undefined;
    let lastArgs: A;

    const cancel = () => {
        if (timer !== undefined) {
            clearTimeout(timer);
            timer = undefined;
        }
        if (maxTimer !== undefined) {
            clearTimeout(maxTimer);
            maxTimer = undefined;
        }
    };
    const invoke = () => {
        cancel();
        fn(...lastArgs);
    };

    return {
        call(...args: A) {
            lastArgs = args;
            const wait = toValue(ms);
            if (wait <= 0) {
                invoke();
                return;
            }
            if (timer !== undefined) {
                clearTimeout(timer);
            }
            timer = setTimeout(invoke, wait);
            if (options.maxWait !== undefined && maxTimer === undefined) {
                maxTimer = setTimeout(invoke, options.maxWait);
            }
        },
        cancel
    };
}

export interface ThrottleOptions {
    /** Invoke on the leading edge of the window. Default true. */
    leading?: boolean;
    /** Invoke the latest pending call on the trailing edge. Default true. */
    trailing?: boolean;
}

export function createThrottle<A extends unknown[]>(
    fn: (...args: A) => void,
    ms: MaybeSignal<number>,
    options: ThrottleOptions = {}
): RateLimited<A> {
    const { leading = true, trailing = true } = options;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastExec = 0;
    let lastArgs: A;

    const cancel = () => {
        if (timer !== undefined) {
            clearTimeout(timer);
            timer = undefined;
        }
    };

    return {
        call(...args: A) {
            lastArgs = args;
            const wait = toValue(ms);
            if (wait <= 0) {
                // Throttling disabled: drop any pending trailing run so it
                // can't fire an unexpected extra call later.
                cancel();
                fn(...args);
                return;
            }
            const elapsed = Date.now() - lastExec;
            if (elapsed >= wait && leading) {
                lastExec = Date.now();
                cancel();
                fn(...args);
            } else if (trailing && timer === undefined) {
                timer = setTimeout(
                    () => {
                        lastExec = Date.now();
                        timer = undefined;
                        fn(...lastArgs);
                    },
                    elapsed >= wait ? wait : wait - elapsed
                );
            }
        },
        cancel
    };
}
