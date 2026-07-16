import { onScopeDispose } from '@sigx/reactivity';

/**
 * Register teardown with the currently-active scope — the owning component's
 * setup, or the innermost running `effectScope()`. Returns `false` (retaining
 * nothing) when called outside any scope; the caller keeps responsibility for
 * disposal then, which is why every composable with ongoing work also returns
 * an explicit `stop()`/`Pausable` handle.
 *
 * @example
 * ```ts
 * const id = setInterval(tick, 1000);
 * tryOnScopeDispose(() => clearInterval(id));
 * ```
 */
export function tryOnScopeDispose(fn: () => void): boolean {
    return onScopeDispose(fn);
}
