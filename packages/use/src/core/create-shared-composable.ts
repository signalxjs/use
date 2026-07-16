import { effectScope } from '@sigx/reactivity';
import type { EffectScope } from '@sigx/reactivity';
import { tryOnScopeDispose } from '../shared/scope.js';

/**
 * Reference-counted sharing of an effect-ful composable: the first subscriber
 * runs it in a fresh detached `effectScope`; later subscribers get the same
 * result. When the last subscriber's scope disposes, the shared scope stops
 * (listeners detach, timers clear) and the next call re-creates everything.
 *
 * The standard way to turn a per-caller sensor into an app singleton —
 * N components share ONE `mousemove` listener.
 *
 * Subscribers are counted per scope. Calls made outside any component or
 * `effectScope` don't participate in refcounting — they receive the shared
 * state but neither keep it alive nor leak counts.
 *
 * Platform: everywhere.
 *
 * @example
 * ```ts
 * export const useSharedMouse = createSharedComposable(useMouse);
 * const mouse = useSharedMouse(); // in any number of components
 * ```
 */
export function createSharedComposable<Fn extends (...args: never[]) => unknown>(composable: Fn): Fn {
    let subscribers = 0;
    let state: unknown;
    let scope: EffectScope | undefined;

    const dispose = () => {
        subscribers -= 1;
        if (scope && subscribers <= 0) {
            scope.stop();
            state = undefined;
            scope = undefined;
        }
    };

    return ((...args: never[]) => {
        if (!scope) {
            scope = effectScope(true);
            state = scope.run(() => composable(...args));
        }
        // Only scoped callers are refcounted; out-of-scope calls would
        // otherwise increment without a matching dispose.
        if (tryOnScopeDispose(dispose)) {
            subscribers += 1;
        }
        return state;
    }) as Fn;
}
