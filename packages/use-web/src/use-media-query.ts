import { signal, watch } from '@sigx/reactivity';
import { toValue } from '@sigx/use';
import type { MaybeSignal, ReadSignal } from '@sigx/use';
import { defaultWindow } from './configurable.js';
import type { ConfigurableWindow } from './configurable.js';

/**
 * Reactive `matchMedia`. A reactive query string re-subscribes; the change
 * listener detaches with the owning scope. SSR: `false`, never subscribes.
 *
 * @example
 * ```ts
 * const isWide = useMediaQuery('(min-width: 1024px)');
 * const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
 * ```
 */
export function useMediaQuery(
    query: MaybeSignal<string>,
    options: ConfigurableWindow = {}
): ReadSignal<boolean> {
    const { window = defaultWindow } = options;
    const matches = signal(false);
    if (!window || typeof window.matchMedia !== 'function') {
        return matches;
    }

    watch(
        () => toValue(query),
        (value, _previous, onCleanup) => {
            const mediaQuery = window.matchMedia(value);
            matches.value = mediaQuery.matches;
            const handler = (event: MediaQueryListEvent) => {
                matches.value = event.matches;
            };
            mediaQuery.addEventListener('change', handler);
            onCleanup(() => mediaQuery.removeEventListener('change', handler));
        },
        { immediate: true }
    );

    return matches;
}
