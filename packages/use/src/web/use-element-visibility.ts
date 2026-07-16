import { signal } from '@sigx/reactivity';
import type { ReadSignal } from '../shared/types.js';
import type { ConfigurableWindow, MaybeSignalElement } from './configurable.js';
import { useIntersectionObserver } from './use-intersection-observer.js';

export interface UseElementVisibilityOptions extends ConfigurableWindow {
    threshold?: number;
    /** Observe within this scroll container instead of the viewport. */
    scrollTarget?: MaybeSignalElement;
}

/**
 * Whether an element intersects the viewport (or `scrollTarget`), as a
 * reactive boolean over `useIntersectionObserver`. SSR: `false`.
 *
 * @example
 * ```ts
 * const visible = useElementVisibility(heroRef);
 * effect(() => { if (visible.value) startAnimation(); });
 * ```
 */
export function useElementVisibility(
    target: MaybeSignalElement,
    options: UseElementVisibilityOptions = {}
): ReadSignal<boolean> {
    const visible = signal(false);
    useIntersectionObserver(
        target,
        (entries) => {
            visible.value = entries.some((entry) => entry.isIntersecting);
        },
        {
            window: options.window,
            root: options.scrollTarget,
            threshold: options.threshold ?? 0
        }
    );
    return visible;
}
