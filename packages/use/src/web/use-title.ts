import { signal, untrack, watch } from '@sigx/reactivity';
import type { PrimitiveSignal } from '@sigx/reactivity';
import { tryOnScopeDispose } from '../shared/scope.js';
import { toValue } from '../shared/to-value.js';
import type { MaybeSignal } from '../shared/types.js';
import { defaultDocument } from './configurable.js';
import type { ConfigurableDocument } from './configurable.js';

export interface UseTitleOptions extends ConfigurableDocument {
    /** Mirror external `document.title` changes back into the signal (MutationObserver). Default false. */
    observe?: boolean;
    /**
     * Restore the title on scope disposal. Not a boolean: pass a function
     * computing the restored value — e.g. `(original) => original` — or
     * `false` (the default) to leave the title as-is.
     */
    restoreOnUnmount?: false | ((original: string, current: string) => string);
}

/**
 * Two-way binding to `document.title`: writing `.value` (or changes in a
 * passed reactive source) sets the title. SSR: the signal works, the DOM is
 * untouched.
 *
 * Boundary vs core's `useHead`: `useHead` is the SSR-rendered, dedupe-aware
 * path and owns first paint; `useTitle` is the imperative client-side signal
 * for post-load dynamic titles (unread counters etc.).
 *
 * @example
 * ```ts
 * const title = useTitle();
 * title.value = `(${unread.value}) Inbox`;
 * ```
 */
export function useTitle(
    newTitle?: MaybeSignal<string | null | undefined>,
    options: UseTitleOptions = {}
): PrimitiveSignal<string | null | undefined> {
    const { document = defaultDocument, observe = false, restoreOnUnmount = false } = options;
    const original = document?.title ?? '';

    const title = signal<string | null | undefined>(
        untrack(() => toValue(newTitle)) ?? document?.title ?? null
    );

    // Reactive source → signal (a plain string initial is already captured).
    if (typeof newTitle === 'function' || (newTitle !== null && typeof newTitle === 'object')) {
        watch(
            () => toValue(newTitle),
            (value) => (title.value = value)
        );
    }

    watch(
        () => title.value,
        (value) => {
            if (typeof value === 'string' && document) document.title = value;
        },
        { immediate: true }
    );

    if (observe && document) {
        const titleElement = document.head.querySelector('title');
        // Resolve the observer from the configured document's realm, not the
        // ambient global — the configurable-globals seam applies here too.
        const ObserverCtor =
            document.defaultView?.MutationObserver ??
            (globalThis as { MutationObserver?: typeof MutationObserver }).MutationObserver;
        if (titleElement && ObserverCtor) {
            const observer = new ObserverCtor(() => {
                if (document.title !== title.value) title.value = document.title;
            });
            observer.observe(titleElement, { childList: true });
            tryOnScopeDispose(() => observer.disconnect());
        }
    }

    if (restoreOnUnmount && document) {
        tryOnScopeDispose(() => {
            document.title = restoreOnUnmount(original, document.title);
        });
    }

    return title;
}
