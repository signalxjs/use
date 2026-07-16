import { signal, untrack } from '@sigx/reactivity';
import type { UseClipboardReturn } from '../contracts.js';
import { tryOnScopeDispose } from '../shared/scope.js';
import { toValue } from '../shared/to-value.js';
import type { MaybeSignal } from '../shared/types.js';
import { defaultDocument, defaultNavigator } from './configurable.js';
import type { ConfigurableDocument, ConfigurableNavigator } from './configurable.js';

export interface UseClipboardOptions extends ConfigurableNavigator, ConfigurableDocument {
    /** Default payload for `copy()` when called without an argument. */
    source?: MaybeSignal<string>;
    /** How long (ms) `copied` stays true after a copy. Default 1500. */
    copiedDuring?: number;
    /** Fall back to `document.execCommand('copy')` where the async API is missing. Default false. */
    legacy?: boolean;
}

/**
 * Clipboard writes on the cross-platform {@link UseClipboardReturn} contract.
 * `copy()` resolves after writing; `copied` stays true for `copiedDuring` ms
 * (timer cleans up with the owning scope) — drive "Copied!" UI with it.
 * SSR / insecure context: `isSupported` false, `copy()` resolves as a no-op.
 *
 * @example
 * ```tsx
 * const { copy, copied, isSupported } = useClipboard();
 * <button onClick={() => copy(shareUrl)}>{copied.value ? 'Copied!' : 'Copy'}</button>
 * ```
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
    const { navigator = defaultNavigator, copiedDuring = 1500, legacy = false } = options;
    const clipboard = navigator?.clipboard;
    const legacyDocument = options.document ?? defaultDocument;
    const isSupported = signal(Boolean(clipboard) || (legacy && Boolean(legacyDocument?.body)));
    const text = signal('');
    const copied = signal(false);

    let timer: ReturnType<typeof setTimeout> | null = null;
    tryOnScopeDispose(() => {
        if (timer !== null) clearTimeout(timer);
    });

    const legacyCopy = (value: string) => {
        const document = legacyDocument;
        if (!document?.body) return false;
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        textarea.remove();
        return ok;
    };

    async function copy(value?: string): Promise<void> {
        const payload = value ?? untrack(() => toValue(options.source)) ?? '';
        if (clipboard) {
            await clipboard.writeText(payload);
        } else if (legacy) {
            if (!legacyCopy(payload)) return;
        } else {
            return;
        }
        text.value = payload;
        copied.value = true;
        if (timer !== null) clearTimeout(timer);
        timer = setTimeout(() => {
            copied.value = false;
            timer = null;
        }, copiedDuring);
    }

    return { isSupported, text, copied, copy };
}
