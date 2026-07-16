import { describe, it, expect, vi } from 'vitest';
import { effectScope, toSignals } from '@sigx/reactivity';
import {
    breakpointsTailwind,
    useBreakpoints,
    useColorScheme,
    useDocumentVisibility,
    useMediaQuery,
    useMouse,
    useOnline,
    useWindowSize
} from '@sigx/use/web';

/** A controllable matchMedia mock; returns the window stub and a flip helper. */
function fakeMatchMedia() {
    const lists = new Map<string, { matches: boolean; listeners: Set<(e: { matches: boolean }) => void> }>();
    const window = {
        matchMedia(query: string) {
            let entry = lists.get(query);
            if (!entry) {
                entry = { matches: false, listeners: new Set() };
                lists.set(query, entry);
            }
            const record = entry;
            return {
                get matches() {
                    return record.matches;
                },
                media: query,
                addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => record.listeners.add(fn),
                removeEventListener: (_: string, fn: (e: { matches: boolean }) => void) => record.listeners.delete(fn)
            };
        }
    } as unknown as Window;
    const set = (query: string, matches: boolean) => {
        const entry = lists.get(query);
        if (!entry) return;
        entry.matches = matches;
        entry.listeners.forEach((fn) => fn({ matches }));
    };
    return { window, set, lists };
}

describe('useMediaQuery', () => {
    it('tracks matches and reacts to changes', () => {
        const { window, set } = fakeMatchMedia();
        const wide = useMediaQuery('(min-width: 1024px)', { window });
        expect(wide.value).toBe(false);
        set('(min-width: 1024px)', true);
        expect(wide.value).toBe(true);
    });

    it('re-subscribes when a reactive query changes', () => {
        const { window, set, lists } = fakeMatchMedia();
        const query = { value: '(min-width: 100px)' };
        const match = useMediaQuery(() => query.value, { window });
        set('(min-width: 100px)', true);
        expect(match.value).toBe(true);
        expect(lists.size).toBe(1);
    });

    it('unsubscribes on scope stop', () => {
        const { window, set, lists } = fakeMatchMedia();
        const scope = effectScope();
        scope.run(() => useMediaQuery('(min-width: 1px)', { window }));
        expect(lists.get('(min-width: 1px)')!.listeners.size).toBe(1);
        scope.stop();
        expect(lists.get('(min-width: 1px)')!.listeners.size).toBe(0);
        set('(min-width: 1px)', true); // no throw, no effect
    });
});

describe('useColorScheme', () => {
    it('maps prefers-color-scheme onto the ColorScheme contract', () => {
        const { window, set } = fakeMatchMedia();
        const scheme = useColorScheme({ window });
        expect(scheme.value).toBe('light');
        set('(prefers-color-scheme: dark)', true);
        expect(scheme.value).toBe('dark');
    });
});

describe('useBreakpoints', () => {
    it('creates lazy memoized queries and computes active()', () => {
        const { window, set, lists } = fakeMatchMedia();
        const bp = useBreakpoints(breakpointsTailwind, { window });

        const isMd = bp.greaterOrEqual('md');
        bp.greaterOrEqual('md'); // memoized — no second subscription
        expect(lists.size).toBe(1);
        expect(isMd.value).toBe(false);
        set('(min-width: 768px)', true);
        expect(isMd.value).toBe(true);

        const active = bp.active();
        set('(min-width: 640px)', true);
        expect(active.value).toBe('md'); // widest matched
    });
});

describe('useMouse', () => {
    // happy-dom never populates pageX/pageY, so tests read client coordinates.
    it('tracks pointer position as one reactive object', () => {
        const mouse = useMouse({ type: 'client' });
        expect(mouse.x).toBe(0);
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 10, clientY: 20 }));
        expect(mouse.x).toBe(10);
        expect(mouse.y).toBe(20);
        expect(mouse.sourceType).toBe('mouse');
    });

    it('destructures via toSignals', () => {
        const { x } = toSignals(useMouse({ type: 'client' }));
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 42, clientY: 0 }));
        expect(x.value).toBe(42);
    });

    it('stops tracking when the scope stops', () => {
        const scope = effectScope();
        const mouse = scope.run(() => useMouse({ type: 'client' }))!;
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 5, clientY: 5 }));
        expect(mouse.x).toBe(5);
        scope.stop();
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 99, clientY: 99 }));
        expect(mouse.x).toBe(5);
    });
});

describe('useWindowSize', () => {
    it('reads the current size and follows resize events', () => {
        const size = useWindowSize({ listenOrientation: false });
        expect(size.width).toBe(window.innerWidth);

        (window as unknown as { innerWidth: number }).innerWidth = 500;
        (window as unknown as { innerHeight: number }).innerHeight = 400;
        window.dispatchEvent(new Event('resize'));
        expect(size.width).toBe(500);
        expect(size.height).toBe(400);
    });
});

describe('useOnline', () => {
    it('follows online/offline events', () => {
        const online = useOnline();
        expect(online.value).toBe(true);
        window.dispatchEvent(new Event('offline'));
        expect(online.value).toBe(false);
        window.dispatchEvent(new Event('online'));
        expect(online.value).toBe(true);
    });
});

describe('useDocumentVisibility', () => {
    it('tracks visibilityState', () => {
        const visibility = useDocumentVisibility();
        expect(visibility.value).toBe('visible');

        vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
        document.dispatchEvent(new Event('visibilitychange'));
        expect(visibility.value).toBe('hidden');
        vi.restoreAllMocks();
    });
});
