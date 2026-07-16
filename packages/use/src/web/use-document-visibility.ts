import { createBox } from '../shared/box.js';
import type { ReadSignal } from '../shared/types.js';
import { defaultDocument } from './configurable.js';
import type { ConfigurableDocument } from './configurable.js';
import { useEventListener } from './use-event-listener.js';

/**
 * Reactive `document.visibilityState` via the `visibilitychange` event.
 * SSR: `'visible'`.
 *
 * @example
 * ```ts
 * const visibility = useDocumentVisibility();
 * watch(visibility, v => v === 'visible' && refetch());
 * ```
 */
export function useDocumentVisibility(
    options: ConfigurableDocument = {}
): ReadSignal<DocumentVisibilityState> {
    const { document = defaultDocument } = options;
    const visibility = createBox<DocumentVisibilityState>(document?.visibilityState ?? 'visible');
    if (!document) return visibility.read;

    useEventListener(document, 'visibilitychange', () => visibility.set(document.visibilityState));
    return visibility.read;
}
