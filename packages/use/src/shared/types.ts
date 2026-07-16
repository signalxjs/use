// ============================================================================
// Shared types - the public type vocabulary of @sigx/use
// ============================================================================

/**
 * Read-only view of a signal-like value. Both `PrimitiveSignal<T>` and
 * `Computed<T>` satisfy it structurally.
 *
 * This is the return type of every single-value read-only composable.
 * It is deliberately structural (not `PrimitiveSignal<T> | Computed<T>`):
 * `PrimitiveSignal` widens literal types (`PrimitiveSignal<'light' | 'dark'>`
 * degrades to `{ value: string }`), while `ReadSignal<'light' | 'dark'>`
 * preserves the union.
 */
export interface ReadSignal<T> {
    readonly value: T;
}

/**
 * A value composables accept "as anything reactive-ish": a plain value, a
 * signal-shaped `{ value }` handle (primitive signal, computed, `toSignal`
 * view), or a getter function. Resolve with {@link toValue}.
 *
 * The sigx equivalent of VueUse's `MaybeRefOrGetter`.
 */
export type MaybeSignal<T> = T | ReadSignal<T> | (() => T);

/**
 * A multi-field reactive return: one deep-reactive object-signal proxy,
 * read via direct property access (`mouse.x`) and tracked per key.
 *
 * `Readonly` is a typing contract — consumers must not write to it. To
 * destructure without losing reactivity, use core's `toSignals()`:
 * `const { x, y } = toSignals(useMouse())`.
 */
export type ReactiveView<T extends object> = Readonly<T>;

/**
 * Control surface returned by composables with ongoing work (timers,
 * observers). `pause()`/`resume()` toggle the work; `isActive` tracks the
 * state reactively.
 */
export interface Pausable {
    /** Whether the underlying work is currently running. */
    isActive: ReadSignal<boolean>;
    pause: () => void;
    resume: () => void;
}

/** Callable handle that detaches whatever the composable attached. */
export type Stop = () => void;
