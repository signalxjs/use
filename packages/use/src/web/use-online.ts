import { signal } from '@sigx/reactivity';
import type { ReadSignal } from '../shared/types.js';
import { defaultWindow } from './configurable.js';
import type { ConfigurableWindow } from './configurable.js';
import { useEventListener } from './use-event-listener.js';

/**
 * Reactive `navigator.onLine` via the `online`/`offline` events — the sugar
 * form of the cross-platform connectivity contract (`useNetwork().isConnected`).
 * SSR: `true`.
 *
 * @example
 * ```ts
 * const online = useOnline();
 * effect(() => { if (!online.value) showOfflineBanner(); });
 * ```
 */
export function useOnline(options: ConfigurableWindow = {}): ReadSignal<boolean> {
    const { window = defaultWindow } = options;
    const online = signal(true);
    if (!window) return online;

    online.value = window.navigator.onLine;
    useEventListener(window, 'online', () => (online.value = true));
    useEventListener(window, 'offline', () => (online.value = false));
    return online;
}
