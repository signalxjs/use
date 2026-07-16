import { batch, computed, signal } from '@sigx/reactivity';
import type { WritableComputed } from '@sigx/reactivity';
import { createThrottle } from '../shared/filters.js';
import { tryOnScopeDispose } from '../shared/scope.js';
import type { MaybeSignal, ReactiveView, ReadSignal } from '../shared/types.js';
import { defaultWindow } from './configurable.js';
import type { ConfigurableWindow } from './configurable.js';
import { unrefElement } from './unref-element.js';
import { useEventListener } from './use-event-listener.js';

export type ScrollTarget = Element | Window | Document | null | undefined;

export interface UseScrollOptions extends ConfigurableWindow {
    /** Throttle scroll handling to at most once per `throttle` ms. Default 0 (off). */
    throttle?: number;
    /** ms of quiet before `isScrolling` flips back to false. Default 200. */
    idle?: number;
    /** Edge tolerance (px) for `arrivedState`. */
    offset?: { left?: number; right?: number; top?: number; bottom?: number };
    /** Scroll behavior for programmatic writes to `x`/`y`. Default 'auto'. */
    behavior?: ScrollBehavior;
    onScroll?: (event: Event) => void;
    onStop?: (event: Event) => void;
}

export interface UseScrollReturn {
    /** Scroll position; writing scrolls the target. */
    x: WritableComputed<number>;
    y: WritableComputed<number>;
    isScrolling: ReadSignal<boolean>;
    /** Which edges the scroll position has arrived at (within `offset`). */
    arrivedState: ReactiveView<{ left: boolean; right: boolean; top: boolean; bottom: boolean }>;
    /** Which directions the latest scroll moved in. */
    directions: ReactiveView<{ left: boolean; right: boolean; top: boolean; bottom: boolean }>;
}

/**
 * Reactive scroll position with edge-arrival and direction detection.
 * Defaults to the window (there is deliberately no separate
 * `useWindowScroll`). Writing `x.value`/`y.value` scrolls the target with
 * the configured `behavior`. Listeners are passive and detach with the
 * owning scope. SSR: zeros, writes no-op.
 *
 * @example
 * ```ts
 * const { y, arrivedState } = useScroll();
 * effect(() => { if (arrivedState.bottom) loadMore(); });
 * y.value = 0; // scroll to top
 * ```
 */
export function useScroll(
    target?: MaybeSignal<ScrollTarget>,
    options: UseScrollOptions = {}
): UseScrollReturn {
    const {
        window = defaultWindow,
        throttle = 0,
        idle = 200,
        offset = {},
        behavior = 'auto',
        onScroll: onScrollCallback,
        onStop: onStopCallback
    } = options;

    const internalX = signal(0);
    const internalY = signal(0);
    const isScrolling = signal(false);
    const arrivedState = signal({ left: true, right: false, top: true, bottom: false });
    const directions = signal({ left: false, right: false, top: false, bottom: false });

    const resolveTarget = (): ScrollTarget =>
        target === undefined ? window : (unrefElement(target as never) as ScrollTarget);

    /** The element whose scroll metrics represent the target. */
    const metricsElement = (t: NonNullable<ScrollTarget>): Element | undefined => {
        if ('scrollX' in t) return t.document.documentElement;
        if ('documentElement' in t) return t.documentElement ?? undefined;
        return t;
    };
    const positions = (t: NonNullable<ScrollTarget>): { x: number; y: number } => {
        if ('scrollX' in t) return { x: t.scrollX, y: t.scrollY };
        const el = metricsElement(t);
        return { x: el?.scrollLeft ?? 0, y: el?.scrollTop ?? 0 };
    };

    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const clearIdle = () => {
        if (idleTimer !== null) {
            clearTimeout(idleTimer);
            idleTimer = null;
        }
    };
    tryOnScopeDispose(clearIdle);

    const measure = (event?: Event) => {
        const t = resolveTarget();
        if (!t) return;
        const { x, y } = positions(t);
        const el = metricsElement(t);
        batch(() => {
            directions.$set({
                left: x < internalX.value,
                right: x > internalX.value,
                top: y < internalY.value,
                bottom: y > internalY.value
            });
            internalX.value = x;
            internalY.value = y;
            if (el) {
                arrivedState.$set({
                    left: x <= (offset.left ?? 0),
                    right: x + el.clientWidth >= el.scrollWidth - (offset.right ?? 0),
                    top: y <= (offset.top ?? 0),
                    bottom: y + el.clientHeight >= el.scrollHeight - (offset.bottom ?? 0)
                });
            }
            if (event) {
                isScrolling.value = true;
            }
        });
        if (event) {
            onScrollCallback?.(event);
            clearIdle();
            idleTimer = setTimeout(() => {
                batch(() => {
                    isScrolling.value = false;
                    directions.$set({ left: false, right: false, top: false, bottom: false });
                });
                onStopCallback?.(event);
            }, idle);
        }
    };

    const handler =
        throttle > 0
            ? createThrottle((event: Event) => measure(event), throttle, { trailing: true })
            : null;
    const onScroll = (event: Event) => (handler ? handler.call(event) : measure(event));
    if (handler) tryOnScopeDispose(handler.cancel);

    if (resolveTarget()) {
        measure();
        useEventListener(
            target === undefined ? (window as EventTarget) : (target as MaybeSignal<EventTarget | null | undefined>),
            'scroll',
            onScroll,
            { passive: true }
        );
    }

    const scrollTo = (left?: number, top?: number) => {
        const t = resolveTarget();
        if (!t || typeof (t as Element).scrollTo !== 'function') return;
        (t as Element).scrollTo({ left, top, behavior });
    };

    const x = computed({
        get: () => internalX.value,
        set: (value: number) => scrollTo(value, undefined)
    });
    const y = computed({
        get: () => internalY.value,
        set: (value: number) => scrollTo(undefined, value)
    });

    return { x, y, isScrolling, arrivedState, directions };
}
