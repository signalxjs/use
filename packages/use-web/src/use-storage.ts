import { signal, toRaw, watch } from '@sigx/reactivity';
import type { Primitive, PrimitiveSignal, Signal } from '@sigx/reactivity';
import type { StorageLike } from '@sigx/use';
import { tryOnMounted } from '@sigx/use';
import { defaultWindow } from './configurable.js';
import type { ConfigurableWindow } from './configurable.js';
import { useEventListener } from './use-event-listener.js';

export interface StorageSerializer<T> {
    read: (raw: string) => T;
    write: (value: T) => string;
}

export interface UseStorageOptions<T> extends ConfigurableWindow {
    /** Backing store. Default `localStorage`. Any {@link StorageLike} works. */
    storage?: StorageLike;
    /** Custom (de)serialization. Default: inferred from the default value's type (JSON for objects). */
    serializer?: StorageSerializer<T>;
    /** Sync across tabs via the `storage` event. Default true. */
    listenToStorageChanges?: boolean;
    /** Write the default value to storage when the key is absent. Default true. */
    writeDefaults?: boolean;
    /** Called with storage/serialization errors. Default: console.error. */
    onError?: (error: unknown) => void;
}

function inferSerializer<T>(defaults: T): StorageSerializer<T> {
    if (typeof defaults === 'number') {
        return { read: (raw) => Number.parseFloat(raw) as T, write: String };
    }
    if (typeof defaults === 'boolean') {
        return { read: (raw) => (raw === 'true') as T, write: String };
    }
    if (typeof defaults === 'object' && defaults !== null) {
        return { read: (raw) => JSON.parse(raw) as T, write: (value) => JSON.stringify(toRaw(value as object)) };
    }
    return { read: (raw) => raw as T, write: String };
}

/**
 * A signal persisted to storage.
 *
 * Object defaults return a **deep-reactive `Signal<T>`**: mutate properties
 * directly (`prefs.theme = 'dark'`) and every change persists automatically
 * (deep watch → serialize); replace wholesale with `prefs.$set(next)`.
 * Primitive defaults return a `PrimitiveSignal<T>` where writing `.value`
 * persists.
 *
 * Cross-tab `storage` events update the signal. SSR: returns the defaults
 * untouched and reads storage on mount — the stored value wins post-
 * hydration, so don't render storage-dependent content above the fold (or
 * accept the swap).
 *
 * @example
 * ```ts
 * const prefs = useStorage('prefs', { theme: 'light', fontSize: 14 });
 * prefs.theme = 'dark';               // persisted, reactive, no .value
 *
 * const token = useStorage('token', ''); // primitive mode
 * token.value = 'abc';                   // persisted
 * ```
 */
export function useStorage<T extends Primitive>(
    key: string,
    defaults: T,
    options?: UseStorageOptions<T>
): PrimitiveSignal<T>;
export function useStorage<T extends object>(
    key: string,
    defaults: T,
    options?: UseStorageOptions<T>
): Signal<T>;
export function useStorage(
    key: string,
    defaults: unknown,
    options: UseStorageOptions<unknown> = {}
): unknown {
    const {
        window = defaultWindow,
        listenToStorageChanges = true,
        writeDefaults = true,
        onError = (error: unknown) => console.error(error)
    } = options;

    let storage = options.storage;
    if (!storage) {
        try {
            storage = window?.localStorage;
        } catch (error) {
            onError(error);
        }
    }

    const isObject = defaults !== null && typeof defaults === 'object';
    const serializer = options.serializer ?? inferSerializer(defaults);

    // Object mode clones the defaults through the serializer so callers'
    // default objects are never mutated by storage updates.
    const data = (
        isObject
            ? signal(serializer.read(serializer.write(defaults)) as object)
            : signal(defaults as Primitive)
    ) as Signal<object> & PrimitiveSignal<unknown>;

    // Guards the echo write while applying an external (storage-sourced) value.
    let applying = false;

    const applyValue = (value: unknown) => {
        applying = true;
        try {
            if (isObject) data.$set(value as object);
            else data.value = value;
        } finally {
            applying = false;
        }
    };

    const read = (raw: string | null | undefined) => {
        if (!storage) return;
        try {
            const value = raw === undefined ? storage.getItem(key) : raw;
            if (value === null) {
                if (raw === undefined) {
                    // Initial read, key absent: keep defaults, optionally seed storage.
                    if (writeDefaults && defaults !== null && defaults !== undefined) {
                        storage.setItem(key, serializer.write(defaults));
                    }
                } else {
                    // Cross-tab removal: reset to defaults WITHOUT re-seeding the
                    // key the other tab deliberately removed.
                    applyValue(isObject ? serializer.read(serializer.write(defaults)) : defaults);
                }
                return;
            }
            applyValue(serializer.read(value));
        } catch (error) {
            onError(error);
        }
    };

    if (storage) {
        // Defer the initial read to mount inside components (post-hydration);
        // immediate everywhere else.
        tryOnMounted(() => read(undefined));

        watch(
            isObject ? (data as object) : () => data.value,
            (value) => {
                if (applying) return;
                try {
                    if (value === null || value === undefined) storage.removeItem(key);
                    else storage.setItem(key, serializer.write(value));
                } catch (error) {
                    onError(error);
                }
            },
            { deep: isObject }
        );

        if (window && listenToStorageChanges) {
            useEventListener(window, 'storage', (event: StorageEvent) => {
                if (event.key === key) read(event.newValue);
            });
        }
    }

    return data;
}
