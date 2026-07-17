import { batch, signal } from '@sigx/reactivity';
import type { MaybeSignal, ReactiveView } from '@sigx/use';
import { defaultWindow } from './configurable.js';
import type { ConfigurableWindow } from './configurable.js';
import { useEventListener } from './use-event-listener.js';

export interface UseMouseOptions extends ConfigurableWindow {
    /** Coordinate system: page (default), client (viewport) or screen. */
    type?: 'page' | 'client' | 'screen';
    /** Also track touch moves. Default true. */
    touch?: boolean;
    /** Listen on a specific target instead of `window`. */
    target?: MaybeSignal<EventTarget | null | undefined>;
    initialValue?: { x: number; y: number };
}

export interface MouseState {
    x: number;
    y: number;
    sourceType: 'mouse' | 'touch' | null;
}

/**
 * Reactive pointer position as ONE reactive `{ x, y, sourceType }` object —
 * per-key tracked, so an `x`-only consumer doesn't re-run on `y` changes.
 * Destructure with core's `toSignals()`. Listeners are passive and detach
 * with the owning scope. SSR: frozen at `initialValue` with `sourceType: null`.
 *
 * Share one listener app-wide with `createSharedComposable(useMouse)`.
 *
 * @example
 * ```ts
 * const mouse = useMouse();
 * effect(() => positionTooltip(mouse.x, mouse.y));
 * const { x, y } = toSignals(useMouse()); // destructure-safe form
 * ```
 */
export function useMouse(options: UseMouseOptions = {}): ReactiveView<MouseState> {
    const { window = defaultWindow, type = 'page', touch = true, initialValue = { x: 0, y: 0 } } = options;
    const state = signal<MouseState>({
        x: initialValue.x,
        y: initialValue.y,
        sourceType: null
    });
    if (!window) return state;

    const target = options.target ?? window;
    const set = (point: { pageX: number; pageY: number; clientX: number; clientY: number; screenX: number; screenY: number }, sourceType: 'mouse' | 'touch') => {
        batch(() => {
            state.x = type === 'page' ? point.pageX : type === 'client' ? point.clientX : point.screenX;
            state.y = type === 'page' ? point.pageY : type === 'client' ? point.clientY : point.screenY;
            state.sourceType = sourceType;
        });
    };

    const onPointer = (event: Event) => set(event as MouseEvent, 'mouse');
    useEventListener(target, 'mousemove', onPointer, { passive: true });
    useEventListener(target, 'dragover', onPointer, { passive: true });
    if (touch) {
        useEventListener(
            target,
            'touchmove',
            (event: Event) => {
                const t = (event as TouchEvent).touches[0];
                if (t) set(t, 'touch');
            },
            { passive: true }
        );
    }
    return state;
}
