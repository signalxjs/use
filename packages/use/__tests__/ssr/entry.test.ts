// @vitest-environment node
//
// SSR safety suite: with no `window`/`document` at all, both entries must
// import cleanly and every web composable must return inert defaults without
// throwing or attaching anything.
import { describe, it, expect } from 'vitest';
import * as root from '@sigx/use';
import * as web from '@sigx/use/web';
import {
    breakpointsTailwind,
    useBreakpoints,
    useClipboard,
    useColorScheme,
    useDocumentVisibility,
    useElementSize,
    useElementVisibility,
    useEventListener,
    useIntersectionObserver,
    useLocalStorage,
    useMediaQuery,
    useMouse,
    useNetwork,
    useOnline,
    useResizeObserver,
    useScroll,
    useSessionStorage,
    useStorage,
    useTitle,
    useWindowSize
} from '@sigx/use/web';

describe('SSR: entries import and export', () => {
    it('both entries expose named bindings', () => {
        expect(Object.keys(root).length).toBeGreaterThan(0);
        expect(Object.keys(web).length).toBeGreaterThan(0);
        expect(web.isClient).toBe(false);
        expect(web.defaultWindow).toBeUndefined();
    });
});

describe('SSR: web composables are inert with documented defaults', () => {
    it('sensors return their documented server defaults', () => {
        expect(useMediaQuery('(min-width: 100px)').value).toBe(false);
        expect(useColorScheme().value).toBe('light');
        expect(useColorScheme({ ssrDefault: 'dark' }).value).toBe('dark');
        expect(useOnline().value).toBe(true);
        expect(useDocumentVisibility().value).toBe('visible');

        const network = useNetwork();
        expect(network.isConnected).toBe(true);
        expect(network.type).toBe('unknown');
        expect(network.isInternetReachable).toBe(null);

        const mouse = useMouse();
        expect(mouse.x).toBe(0);
        expect(mouse.sourceType).toBe(null);

        const size = useWindowSize();
        expect(size.width).toBe(Number.POSITIVE_INFINITY);
    });

    it('event listeners, observers, scroll and breakpoints no-op', () => {
        expect(() => useEventListener('resize', () => {})()).not.toThrow();

        const resize = useResizeObserver(null, () => {});
        expect(resize.isSupported.value).toBe(false);
        expect(() => resize.stop()).not.toThrow();

        const intersection = useIntersectionObserver(null, () => {});
        expect(intersection.isSupported.value).toBe(false);
        expect(() => {
            intersection.pause();
            intersection.resume();
            intersection.stop();
        }).not.toThrow();

        expect(useElementSize(null).width).toBe(0);
        expect(useElementVisibility(null).value).toBe(false);

        const scroll = useScroll();
        expect(scroll.y.value).toBe(0);
        expect(() => (scroll.y.value = 100)).not.toThrow(); // write no-ops
        expect(scroll.arrivedState.top).toBe(true);

        const bp = useBreakpoints(breakpointsTailwind);
        expect(bp.greaterOrEqual('md').value).toBe(false);
        expect(bp.active().value).toBe('');
    });

    it('storage returns defaults untouched; clipboard is unsupported', async () => {
        const prefs = useStorage('prefs', { theme: 'light' });
        expect(prefs.theme).toBe('light');
        const token = useLocalStorage('token', 'anon');
        expect(token.value).toBe('anon');
        const draft = useSessionStorage('draft', '');
        expect(draft.value).toBe('');

        const title = useTitle('Hello');
        expect(title.value).toBe('Hello'); // signal works, DOM untouched

        const clipboard = useClipboard();
        expect(clipboard.isSupported.value).toBe(false);
        await expect(clipboard.copy('x')).resolves.toBeUndefined();
        expect(clipboard.copied.value).toBe(false);
    });

    it('root composables work in plain node', () => {
        const [state, toggle] = root.useToggle();
        toggle();
        expect(state.value).toBe(true);
    });
});
