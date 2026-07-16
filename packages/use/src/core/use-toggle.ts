import { signal } from '@sigx/reactivity';
import type { PrimitiveSignal } from '@sigx/reactivity';

export type Toggler = (value?: boolean) => boolean;

/**
 * A boolean signal with a toggler. Calling the toggler with no argument
 * flips the value; calling it with a boolean sets it. Returns the new value.
 *
 * Pass an existing boolean signal to get just a toggler bound to it.
 *
 * Platform: everywhere. No cleanup needed.
 *
 * @example
 * ```ts
 * const [dark, toggleDark] = useToggle(false);
 * toggleDark();      // true
 * toggleDark(false); // explicit set
 *
 * const open = signal(false);
 * const toggleOpen = useToggle(open);
 * ```
 */
export function useToggle(initial?: boolean): [PrimitiveSignal<boolean>, Toggler];
export function useToggle(source: PrimitiveSignal<boolean>): Toggler;
export function useToggle(
    initialOrSource: boolean | PrimitiveSignal<boolean> = false
): [PrimitiveSignal<boolean>, Toggler] | Toggler {
    if (typeof initialOrSource === 'object') {
        const source = initialOrSource;
        return (value?: boolean) => (source.value = typeof value === 'boolean' ? value : !source.value);
    }
    const state = signal(initialOrSource);
    const toggle: Toggler = (value?: boolean) =>
        (state.value = typeof value === 'boolean' ? value : !state.value);
    return [state, toggle];
}
