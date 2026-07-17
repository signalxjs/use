import { batch, signal } from '@sigx/reactivity';
import type { ConnectionType, NetworkState } from '@sigx/use';
import type { ReactiveView } from '@sigx/use';
import { defaultWindow } from './configurable.js';
import type { ConfigurableWindow } from './configurable.js';
import { useEventListener } from './use-event-listener.js';

export interface WebNetworkState extends NetworkState {
    /** Network Information API extras — undefined where the API is missing. */
    effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
    downlink?: number;
    saveData?: boolean;
}

interface NetworkInformationLike extends EventTarget {
    type?: string;
    effectiveType?: WebNetworkState['effectiveType'];
    downlink?: number;
    saveData?: boolean;
}

const KNOWN_TYPES: readonly ConnectionType[] = ['wifi', 'cellular', 'ethernet', 'bluetooth', 'none', 'unknown'];

/**
 * Reactive network state on the cross-platform {@link NetworkState} contract:
 * `navigator.onLine` → `isConnected`, Network Information API `type` where
 * available (else `'unknown'`), `isInternetReachable: null` (the web cannot
 * know). Web-only extras (`effectiveType`, `downlink`, `saveData`) ride along.
 * SSR: `{ isConnected: true, type: 'unknown', isInternetReachable: null }`.
 *
 * @example
 * ```ts
 * const network = useNetwork();
 * effect(() => console.log(network.isConnected, network.effectiveType));
 * ```
 */
export function useNetwork(options: ConfigurableWindow = {}): ReactiveView<WebNetworkState> {
    const { window = defaultWindow } = options;
    const state = signal<WebNetworkState>({
        isConnected: true,
        type: 'unknown',
        isInternetReachable: null
    });
    if (!window) return state;

    const connection = (window.navigator as Navigator & { connection?: NetworkInformationLike }).connection;

    const update = () => {
        batch(() => {
            state.isConnected = window.navigator.onLine;
            const raw = connection?.type;
            state.type = (KNOWN_TYPES as readonly string[]).includes(raw ?? '')
                ? (raw as ConnectionType)
                : 'unknown';
            state.effectiveType = connection?.effectiveType;
            state.downlink = connection?.downlink;
            state.saveData = connection?.saveData;
        });
    };

    update();
    useEventListener(window, 'online', update);
    useEventListener(window, 'offline', update);
    if (connection) {
        useEventListener(connection, 'change', update);
    }
    return state;
}
