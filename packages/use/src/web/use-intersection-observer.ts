import { signal, watch } from '@sigx/reactivity';
import type { Pausable, ReadSignal, Stop } from '../shared/types.js';
import { defaultWindow } from './configurable.js';
import type { ConfigurableWindow, MaybeSignalElement } from './configurable.js';
import { unrefElement } from './unref-element.js';

export interface UseIntersectionObserverOptions extends ConfigurableWindow {
    root?: MaybeSignalElement | Document;
    rootMargin?: string;
    threshold?: number | number[];
    /** Start observing on creation. Default true. */
    immediate?: boolean;
}

export interface UseIntersectionObserverReturn extends Pausable {
    isSupported: ReadSignal<boolean>;
    stop: Stop;
}

/**
 * Observe viewport intersection with an `IntersectionObserver` that follows
 * reactive targets, supports `pause()`/`resume()` without losing config, and
 * disconnects with the owning scope. SSR / unsupported: inert, `isSupported`
 * false.
 *
 * @example
 * ```ts
 * const sentinel = signal<HTMLElement | null>(null);
 * useIntersectionObserver(sentinel, ([e]) => e.isIntersecting && loadMore());
 * ```
 */
export function useIntersectionObserver(
    target: MaybeSignalElement | MaybeSignalElement[],
    callback: IntersectionObserverCallback,
    options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
    const { window = defaultWindow, immediate = true, rootMargin, threshold } = options;
    const isSupported = signal(Boolean(window && 'IntersectionObserver' in window));
    const isActive = signal(immediate && isSupported.value);
    const targets = Array.isArray(target) ? target : [target];

    if (!isSupported.value) {
        return {
            isSupported,
            isActive,
            pause: () => {},
            resume: () => {},
            stop: () => {}
        };
    }

    const handle = watch(
        () => ({
            elements: targets.map((t) => unrefElement(t)).filter((el): el is Element => el != null),
            active: isActive.value
        }),
        ({ elements, active }, _previous, onCleanup) => {
            if (!active || !elements.length) return;
            const ObserverCtor = (window as Window & typeof globalThis).IntersectionObserver;
            const observer = new ObserverCtor(callback, {
                root: (unrefElement(options.root as MaybeSignalElement) as Element | Document | null) ?? undefined,
                rootMargin,
                threshold
            });
            for (const el of elements) observer.observe(el);
            onCleanup(() => observer.disconnect());
        },
        { immediate: true }
    );

    return {
        isSupported,
        isActive,
        pause: () => (isActive.value = false),
        resume: () => (isActive.value = true),
        // Terminal: the watcher is gone, so resume() can't revive it —
        // isActive is forced false to keep the Pausable contract truthful.
        stop: () => {
            isActive.value = false;
            handle.stop();
        }
    };
}
