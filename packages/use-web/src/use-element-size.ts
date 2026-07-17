import { batch, signal } from '@sigx/reactivity';
import type { WindowSizeState } from '@sigx/use';
import type { ReactiveView } from '@sigx/use';
import type { MaybeSignalElement } from './configurable.js';
import { useResizeObserver } from './use-resize-observer.js';
import type { UseResizeObserverOptions } from './use-resize-observer.js';

/**
 * An element's content size as ONE reactive `{ width, height }` object,
 * driven by `useResizeObserver`. Destructure with core's `toSignals()`.
 * SSR: stays at `initialSize`.
 *
 * @example
 * ```ts
 * const el = signal<HTMLElement | null>(null);
 * const size = useElementSize(el);
 * const isNarrow = computed(() => size.width < 480);
 * ```
 */
export function useElementSize(
    target: MaybeSignalElement,
    initialSize: WindowSizeState = { width: 0, height: 0 },
    options: UseResizeObserverOptions = {}
): ReactiveView<WindowSizeState> {
    const size = signal<WindowSizeState>({ width: initialSize.width, height: initialSize.height });
    useResizeObserver(
        target,
        (entries) => {
            const entry = entries[entries.length - 1];
            if (!entry) return;
            batch(() => {
                size.width = entry.contentRect.width;
                size.height = entry.contentRect.height;
            });
        },
        options
    );
    return size;
}
