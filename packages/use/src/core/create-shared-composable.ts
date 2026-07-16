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
 * Subscribers are counted per scope: calls made outside any component or
 * `effectScope` keep the shared state alive forever (nothing to dispose with).
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
        subscribers += 1;
        if (!scope) {
            scope = effectScope(true);
            state = scope.run(() => composable(...args));
        }
        tryOnScopeDispose(dispose);
        return state;
    }) as Fn;
}
