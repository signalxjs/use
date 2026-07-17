import { computed } from '@sigx/reactivity';
import type { ColorScheme } from '@sigx/use';
import type { ReadSignal } from '@sigx/use';
import { defaultWindow } from './configurable.js';
import type { ConfigurableWindow } from './configurable.js';
import { useMediaQuery } from './use-media-query.js';

export interface UseColorSchemeOptions extends ConfigurableWindow {
    /** Value reported on the server / where `matchMedia` is unavailable. Default 'light'. */
    ssrDefault?: ColorScheme;
}

/**
 * The system color-scheme preference as the cross-platform
 * {@link ColorScheme} contract (`no-preference` maps to `'light'`) — the
 * same return shape as Lynx's `useSystemColorScheme`, so theme code ports
 * across platforms unchanged.
 *
 * @example
 * ```ts
 * const scheme = useColorScheme();
 * effect(() => (document.documentElement.dataset.theme = scheme.value));
 * ```
 */
export function useColorScheme(options: UseColorSchemeOptions = {}): ReadSignal<ColorScheme> {
    const { window = defaultWindow, ssrDefault = 'light' } = options;
    if (!window || typeof window.matchMedia !== 'function') {
        return computed(() => ssrDefault);
    }
    const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', options);
    return computed(() => (prefersDark.value ? 'dark' : 'light'));
}
