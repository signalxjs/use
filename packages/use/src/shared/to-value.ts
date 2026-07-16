import { isComputed, isSignal } from '@sigx/reactivity';
import type { MaybeSignal } from './types.js';

/**
 * Resolve a {@link MaybeSignal} to its current value: call getters, unwrap
 * signal-shaped `{ value }` handles (primitive signals, computeds,
 * `toSignal`/`toSignals` views), pass everything else through.
 *
 * Reading inside a reactive context tracks as usual — `toValue` adds no
 * `untrack`.
 *
 * Note: a plain (non-signal) object that happens to have a `value` property
 * is passed through as-is; hand it to a composable as a getter (`() => obj`)
 * if it should be treated as a value.
 *
 * @example
 * ```ts
 * toValue(42);                 // 42
 * toValue(signal(42));         // 42
 * toValue(computed(() => 42)); // 42
 * toValue(() => 42);           // 42
 * ```
 */
export function toValue<T>(source: MaybeSignal<T>): T {
    if (typeof source === 'function') {
        return (source as () => T)();
    }
    if (isComputed(source) || isSignal(source)) {
        return (source as { value: T }).value;
    }
    return source as T;
}
