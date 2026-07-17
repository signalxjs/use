import { batch, signal, watch } from '@sigx/reactivity';
import type { WindowSizeState } from '@sigx/use';
import type { ReactiveView } from '@sigx/use';
import { defaultWindow } from './configurable.js';
import type { ConfigurableWindow } from './configurable.js';
import { useEventListener } from './use-event-listener.js';
import { useMediaQuery } from './use-media-query.js';

export interface UseWindowSizeOptions extends ConfigurableWindow {
    /** SSR width. Defaults to Infinity so desktop-first computeds fail visibly, not mobile-silently. */
    initialWidth?: number;
    /** SSR height. Default Infinity. */
    initialHeight?: number;
    /** Also re-measure on orientation changes. Default true. */
    listenOrientation?: boolean;
}

/**
 * Reactive window inner size on the cross-platform {@link WindowSizeState}
 * contract (Lynx implements the same shape from its viewport APIs).
 * SSR: stays at the initial values.
 *
 * @example
 * ```ts
 * const size = useWindowSize();
 * const cols = computed(() => (size.width < 768 ? 1 : 3));
 * ```
 */
export function useWindowSize(options: UseWindowSizeOptions = {}): ReactiveView<WindowSizeState> {
    const {
        window = defaultWindow,
        initialWidth = Number.POSITIVE_INFINITY,
        initialHeight = Number.POSITIVE_INFINITY,
        listenOrientation = true
    } = options;
    const size = signal<WindowSizeState>({ width: initialWidth, height: initialHeight });
    if (!window) return size;

    const update = () => {
        batch(() => {
            size.width = window.innerWidth;
            size.height = window.innerHeight;
        });
    };
    update();
    useEventListener(window, 'resize', update, { passive: true });
    if (listenOrientation) {
        const portrait = useMediaQuery('(orientation: portrait)', options);
        watch(() => portrait.value, () => update());
    }
    return size;
}
