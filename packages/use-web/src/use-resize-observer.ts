import { signal, watch } from '@sigx/reactivity';
import type { ReadSignal, Stop } from '@sigx/use';
import { defaultWindow } from './configurable.js';
import type { ConfigurableWindow, MaybeSignalElement } from './configurable.js';
import { unrefElement } from './unref-element.js';

export interface UseResizeObserverOptions extends ConfigurableWindow, ResizeObserverOptions {}

export interface UseResizeObserverReturn {
    isSupported: ReadSignal<boolean>;
    stop: Stop;
}

/**
 * Observe element size changes with a `ResizeObserver` that follows reactive
 * targets (re-observes when the element changes) and disconnects with the
 * owning scope. SSR / unsupported: `isSupported` is false, the callback
 * never fires.
 *
 * @example
 * ```ts
 * const box = signal<HTMLElement | null>(null);
 * useResizeObserver(box, ([entry]) => console.log(entry.contentRect.width));
 * ```
 */
export function useResizeObserver(
    target: MaybeSignalElement | MaybeSignalElement[],
    callback: ResizeObserverCallback,
    options: UseResizeObserverOptions = {}
): UseResizeObserverReturn {
    const { window = defaultWindow, ...observerOptions } = options;
    const isSupported = signal(Boolean(window && 'ResizeObserver' in window));
    const targets = Array.isArray(target) ? target : [target];

    if (!isSupported.value) {
        return { isSupported, stop: () => {} };
    }

    const handle = watch(
        () => targets.map((t) => unrefElement(t)).filter((el): el is Element => el != null),
        (elements, _previous, onCleanup) => {
            if (!elements.length) return;
            const ObserverCtor = (window as Window & typeof globalThis).ResizeObserver;
            const observer = new ObserverCtor(callback);
            for (const el of elements) observer.observe(el, observerOptions);
            onCleanup(() => observer.disconnect());
        },
        { immediate: true }
    );

    return { isSupported, stop: () => handle.stop() };
}
