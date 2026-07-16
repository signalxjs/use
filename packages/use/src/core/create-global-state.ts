import { effectScope } from '@sigx/reactivity';

/**
 * Wrap a state factory so its first call runs inside a detached
 * `effectScope()` and every later call returns the same cached result —
 * app-wide shared signals without a store. The scope is never disposed.
 *
 * SSR caveat: the cache is module-level, shared across every request in the
 * process. Use for device/UI state only, never per-user data — that's
 * `defineStore`'s job (`@sigx/store`).
 *
 * Platform: everywhere.
 *
 * @example
 * ```ts
 * export const useFilters = createGlobalState(() =>
 *   signal({ q: '', tags: [] as string[] })
 * );
 * // any component: const filters = useFilters(); filters.q = 'x';
 * ```
 */
export function createGlobalState<Fn extends (...args: never[]) => unknown>(stateFactory: Fn): Fn {
    let initialized = false;
    let state: unknown;
    const scope = effectScope(true);
    return ((...args: never[]) => {
        if (!initialized) {
            state = scope.run(() => stateFactory(...args));
            initialized = true;
        }
        return state;
    }) as Fn;
}
