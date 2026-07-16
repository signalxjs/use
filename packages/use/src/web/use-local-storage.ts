import type { Primitive, PrimitiveSignal, Signal } from '@sigx/reactivity';
import { defaultWindow } from './configurable.js';
import { useStorage } from './use-storage.js';
import type { UseStorageOptions } from './use-storage.js';

type AnyUseStorage = (key: string, defaults: unknown, options?: UseStorageOptions<unknown>) => unknown;

/**
 * `useStorage` preset backed by `window.localStorage`. See {@link useStorage}
 * for the full semantics (object proxies auto-persist, cross-tab sync, SSR).
 *
 * @example
 * ```ts
 * const prefs = useLocalStorage('prefs', { theme: 'light' });
 * prefs.theme = 'dark'; // persisted
 * ```
 */
export function useLocalStorage<T extends Primitive>(
    key: string,
    defaults: T,
    options?: UseStorageOptions<T>
): PrimitiveSignal<T>;
export function useLocalStorage<T extends object>(
    key: string,
    defaults: T,
    options?: UseStorageOptions<T>
): Signal<T>;
export function useLocalStorage(
    key: string,
    defaults: unknown,
    options: UseStorageOptions<unknown> = {}
): unknown {
    return (useStorage as AnyUseStorage)(key, defaults, options);
}

/**
 * `useStorage` preset backed by `window.sessionStorage`. See
 * {@link useStorage} for the full semantics.
 *
 * @example
 * ```ts
 * const draft = useSessionStorage('draft', '');
 * draft.value = 'hello'; // persisted for this tab session
 * ```
 */
export function useSessionStorage<T extends Primitive>(
    key: string,
    defaults: T,
    options?: UseStorageOptions<T>
): PrimitiveSignal<T>;
export function useSessionStorage<T extends object>(
    key: string,
    defaults: T,
    options?: UseStorageOptions<T>
): Signal<T>;
export function useSessionStorage(
    key: string,
    defaults: unknown,
    options: UseStorageOptions<unknown> = {}
): unknown {
    const { window = defaultWindow } = options;
    let storage = options.storage;
    if (!storage) {
        try {
            storage = window?.sessionStorage;
        } catch {
            // handled downstream by useStorage's own onError path
        }
    }
    return (useStorage as AnyUseStorage)(key, defaults, { ...options, storage });
}
