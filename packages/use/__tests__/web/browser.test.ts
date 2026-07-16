import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signal } from '@sigx/reactivity';
import { useClipboard, useLocalStorage, useSessionStorage, useStorage, useTitle } from '@sigx/use/web';

beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
});

describe('useStorage', () => {
    it('primitive mode: persists .value writes and writes defaults', () => {
        const token = useStorage('token', 'anon');
        expect(token.value).toBe('anon');
        expect(localStorage.getItem('token')).toBe('anon'); // writeDefaults

        token.value = 'abc';
        expect(localStorage.getItem('token')).toBe('abc');
    });

    it('primitive mode: reads an existing value with the inferred serializer', () => {
        localStorage.setItem('count', '42');
        const count = useStorage('count', 0);
        expect(count.value).toBe(42);

        localStorage.setItem('flag', 'true');
        const flag = useStorage('flag', false);
        expect(flag.value).toBe(true);
    });

    it('object mode: property mutations auto-persist; $set replaces wholesale', () => {
        const prefs = useStorage('prefs', { theme: 'light', fontSize: 14 });
        prefs.theme = 'dark';
        expect(JSON.parse(localStorage.getItem('prefs')!)).toEqual({ theme: 'dark', fontSize: 14 });

        prefs.$set({ theme: 'sepia', fontSize: 16 });
        expect(JSON.parse(localStorage.getItem('prefs')!)).toEqual({ theme: 'sepia', fontSize: 16 });
    });

    it('object mode: never mutates the caller-supplied defaults object', () => {
        const defaults = { theme: 'light' };
        const prefs = useStorage('prefs2', defaults);
        prefs.theme = 'dark';
        expect(defaults.theme).toBe('light');
    });

    it('object mode: loads existing JSON', () => {
        localStorage.setItem('prefs3', JSON.stringify({ theme: 'dark', fontSize: 20 }));
        const prefs = useStorage('prefs3', { theme: 'light', fontSize: 14 });
        expect(prefs.theme).toBe('dark');
        expect(prefs.fontSize).toBe(20);
    });

    it('syncs from cross-tab storage events', () => {
        const token = useStorage('shared', 'a');
        window.dispatchEvent(new StorageEvent('storage', { key: 'shared', newValue: 'b' }));
        expect(token.value).toBe('b');

        window.dispatchEvent(new StorageEvent('storage', { key: 'other', newValue: 'x' }));
        expect(token.value).toBe('b'); // unrelated key ignored
    });

    it('routes storage errors to onError', () => {
        const onError = vi.fn();
        const broken = {
            getItem: () => {
                throw new Error('nope');
            },
            setItem: () => {
                throw new Error('nope');
            },
            removeItem: () => {}
        };
        const value = useStorage('broken', 'x', { storage: broken, onError });
        expect(value.value).toBe('x'); // defaults survive
        expect(onError).toHaveBeenCalled();
    });
});

describe('useLocalStorage / useSessionStorage', () => {
    it('use their respective backing stores', () => {
        const a = useLocalStorage('k', 'local');
        const b = useSessionStorage('k', 'session');
        a.value = 'L';
        b.value = 'S';
        expect(localStorage.getItem('k')).toBe('L');
        expect(sessionStorage.getItem('k')).toBe('S');
    });
});

describe('useTitle', () => {
    it('two-way binds document.title', () => {
        const title = useTitle();
        title.value = 'Hello';
        expect(document.title).toBe('Hello');
    });

    it('follows a reactive source', () => {
        const unread = signal(2);
        useTitle(() => `(${unread.value}) Inbox`);
        expect(document.title).toBe('(2) Inbox');
        unread.value = 5;
        expect(document.title).toBe('(5) Inbox');
    });
});

describe('useClipboard', () => {
    it('copies via the async clipboard API and resets copied after copiedDuring', async () => {
        vi.useFakeTimers();
        const writeText = vi.fn().mockResolvedValue(undefined);
        const navigator = { clipboard: { writeText } } as unknown as Navigator;

        const { copy, copied, text, isSupported } = useClipboard({ navigator, copiedDuring: 1000 });
        expect(isSupported.value).toBe(true);

        await copy('hello');
        expect(writeText).toHaveBeenCalledWith('hello');
        expect(text.value).toBe('hello');
        expect(copied.value).toBe(true);

        vi.advanceTimersByTime(1000);
        expect(copied.value).toBe(false);
        vi.useRealTimers();
    });

    it('uses the reactive source as the default payload', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        const navigator = { clipboard: { writeText } } as unknown as Navigator;
        const url = signal('https://sigx.dev');
        const { copy } = useClipboard({ navigator, source: url });
        await copy();
        expect(writeText).toHaveBeenCalledWith('https://sigx.dev');
    });

    it('is unsupported without a clipboard and copy() no-ops', async () => {
        const { isSupported, copy, copied } = useClipboard({ navigator: {} as Navigator });
        expect(isSupported.value).toBe(false);
        await copy('x');
        expect(copied.value).toBe(false);
    });
});
