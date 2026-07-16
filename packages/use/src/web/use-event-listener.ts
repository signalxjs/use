import { watch } from '@sigx/reactivity';
import type { MaybeSignal, ReadSignal, Stop } from '../shared/types.js';
import { defaultWindow, noop } from './configurable.js';
import type { MaybeSignalElement } from './configurable.js';
import { unrefElement } from './unref-element.js';

type MaybeSignalEventTarget =
    | MaybeSignal<EventTarget | null | undefined>
    | ReadSignal<EventTarget | null | undefined>
    | { current: EventTarget | null | undefined };

/**
 * Attach an event listener that lives exactly as long as the owning scope:
 * added now (or whenever a reactive target produces an element), removed on
 * scope disposal, re-attached when the target changes. Returns an explicit
 * `stop()` for standalone use.
 *
 * Omit the target to listen on `window`. SSR: no-op, returns a noop stop.
 *
 * @example
 * ```ts
 * useEventListener('keydown', onKey); // window
 *
 * const el = signal<HTMLElement | null>(null); // template ref
 * useEventListener(el, 'click', onClick);      // re-attaches when el changes
 * ```
 */
export function useEventListener<K extends keyof WindowEventMap>(
    event: K | K[],
    listener: (ev: WindowEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
): Stop;
export function useEventListener<K extends keyof WindowEventMap>(
    target: Window,
    event: K | K[],
    listener: (ev: WindowEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
): Stop;
export function useEventListener<K extends keyof DocumentEventMap>(
    target: Document,
    event: K | K[],
    listener: (ev: DocumentEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
): Stop;
export function useEventListener<K extends keyof HTMLElementEventMap>(
    target: MaybeSignalElement,
    event: K | K[],
    listener: (ev: HTMLElementEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
): Stop;
export function useEventListener(
    target: MaybeSignalEventTarget,
    event: string | string[],
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
): Stop;
export function useEventListener(...args: unknown[]): Stop {
    let target: MaybeSignalEventTarget;
    let events: string | string[];
    let listener: EventListenerOrEventListenerObject;
    let options: boolean | AddEventListenerOptions | undefined;

    if (typeof args[0] === 'string' || Array.isArray(args[0])) {
        [events, listener, options] = args as [string | string[], EventListenerOrEventListenerObject, typeof options];
        target = defaultWindow;
    } else {
        [target, events, listener, options] = args as [
            typeof target,
            string | string[],
            EventListenerOrEventListenerObject,
            typeof options
        ];
    }
    if (target === undefined || target === null) {
        return noop;
    }

    const names = Array.isArray(events) ? events : [events];
    const handle = watch(
        () => unrefElement(target),
        (el, _previous, onCleanup) => {
            if (!el) return;
            for (const name of names) el.addEventListener(name, listener, options);
            onCleanup(() => {
                for (const name of names) el.removeEventListener(name, listener, options);
            });
        },
        { immediate: true }
    );

    return () => handle.stop();
}
