import { describe, it, expect, vi } from 'vitest';
import { effectScope, signal } from '@sigx/reactivity';
import { useElementSize, useElementVisibility, useIntersectionObserver, useResizeObserver } from '@sigx/use-web';

/** Window stub carrying controllable observer constructors. */
function observerWindow() {
    const resizeInstances: MockResizeObserver[] = [];
    const intersectionInstances: MockIntersectionObserver[] = [];

    class MockResizeObserver {
        observed: Element[] = [];
        constructor(public callback: ResizeObserverCallback) {
            resizeInstances.push(this);
        }
        observe(el: Element) {
            this.observed.push(el);
        }
        unobserve(el: Element) {
            this.observed = this.observed.filter((o) => o !== el);
        }
        disconnect() {
            this.observed = [];
        }
        emit(entries: Partial<ResizeObserverEntry>[]) {
            this.callback(entries as ResizeObserverEntry[], this as unknown as ResizeObserver);
        }
    }
    class MockIntersectionObserver {
        observed: Element[] = [];
        constructor(public callback: IntersectionObserverCallback) {
            intersectionInstances.push(this);
        }
        observe(el: Element) {
            this.observed.push(el);
        }
        disconnect() {
            this.observed = [];
        }
        emit(entries: Partial<IntersectionObserverEntry>[]) {
            this.callback(entries as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
        }
    }

    const win = {
        ResizeObserver: MockResizeObserver,
        IntersectionObserver: MockIntersectionObserver
    } as unknown as Window;
    return { win, resizeInstances, intersectionInstances };
}

describe('useResizeObserver', () => {
    it('observes, follows a template-ref target, disconnects with the scope', () => {
        const { win, resizeInstances } = observerWindow();
        const first = document.createElement('div');
        const second = document.createElement('div');
        // The shape sigx's JSX ref prop writes into (renderer applyRef).
        const target = signal({ current: null as HTMLElement | null });
        const callback = vi.fn();

        const scope = effectScope();
        scope.run(() => useResizeObserver(target, callback, { window: win }));
        expect(resizeInstances).toHaveLength(0); // no element yet

        target.current = first;
        expect(resizeInstances).toHaveLength(1);
        expect(resizeInstances[0].observed).toEqual([first]); // raw identity via unrefElement

        target.current = second;
        expect(resizeInstances).toHaveLength(2);
        expect(resizeInstances[0].observed).toEqual([]); // disconnected
        expect(resizeInstances[1].observed).toEqual([second]);

        scope.stop();
        expect(resizeInstances[1].observed).toEqual([]);
    });

    it('reports isSupported=false and stays inert without the API', () => {
        const { isSupported } = useResizeObserver(document.createElement('div'), vi.fn(), {
            window: {} as Window
        });
        expect(isSupported.value).toBe(false);
    });
});

describe('useElementSize', () => {
    it('tracks contentRect through the observer', () => {
        const { win, resizeInstances } = observerWindow();
        const el = document.createElement('div');
        const size = useElementSize(el, { width: 0, height: 0 }, { window: win });
        expect(size.width).toBe(0);

        resizeInstances[0].emit([{ contentRect: { width: 120, height: 60 } as DOMRectReadOnly }]);
        expect(size.width).toBe(120);
        expect(size.height).toBe(60);
    });
});

describe('useIntersectionObserver', () => {
    it('observes, pauses and resumes without losing config', () => {
        const { win, intersectionInstances } = observerWindow();
        const el = document.createElement('div');
        const callback = vi.fn();
        const { pause, resume, isActive } = useIntersectionObserver(el, callback, { window: win });

        expect(intersectionInstances).toHaveLength(1);
        expect(isActive.value).toBe(true);

        pause();
        expect(intersectionInstances[0].observed).toEqual([]);
        resume();
        expect(intersectionInstances).toHaveLength(2);
        expect(intersectionInstances[1].observed).toEqual([el]);
    });
});

describe('useElementVisibility', () => {
    it('reflects isIntersecting', () => {
        const { win, intersectionInstances } = observerWindow();
        const el = document.createElement('div');
        const visible = useElementVisibility(el, { window: win });
        expect(visible.value).toBe(false);

        intersectionInstances[0].emit([{ isIntersecting: true }]);
        expect(visible.value).toBe(true);
        intersectionInstances[0].emit([{ isIntersecting: false }]);
        expect(visible.value).toBe(false);
    });
});
