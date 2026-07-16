import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useScroll } from '@sigx/use/web';

function scrollableElement() {
    const el = document.createElement('div');
    Object.defineProperties(el, {
        clientWidth: { value: 100 },
        clientHeight: { value: 100 },
        scrollWidth: { value: 300 },
        scrollHeight: { value: 300 }
    });
    let left = 0;
    let top = 0;
    Object.defineProperties(el, {
        scrollLeft: { get: () => left, set: (v) => (left = v) },
        scrollTop: { get: () => top, set: (v) => (top = v) }
    });
    el.scrollTo = ((opts: ScrollToOptions) => {
        if (opts.left !== undefined) left = opts.left;
        if (opts.top !== undefined) top = opts.top;
        el.dispatchEvent(new Event('scroll'));
    }) as typeof el.scrollTo;
    return el;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useScroll', () => {
    it('tracks position, directions, arrivedState and isScrolling', () => {
        const el = scrollableElement();
        const { x, y, isScrolling, arrivedState, directions } = useScroll(el, { idle: 100 });

        expect(y.value).toBe(0);
        expect(arrivedState.top).toBe(true);
        expect(arrivedState.bottom).toBe(false);

        el.scrollTop = 200;
        el.dispatchEvent(new Event('scroll'));
        expect(y.value).toBe(200);
        expect(directions.bottom).toBe(true);
        expect(isScrolling.value).toBe(true);
        expect(arrivedState.bottom).toBe(true); // 200 + 100 >= 300

        vi.advanceTimersByTime(100);
        expect(isScrolling.value).toBe(false);
        expect(directions.bottom).toBe(false);

        expect(x.value).toBe(0);
    });

    it('writing x/y scrolls the target', () => {
        const el = scrollableElement();
        const { y } = useScroll(el);
        y.value = 150;
        expect(el.scrollTop).toBe(150);
        expect(y.value).toBe(150); // scroll event fed back
    });

    it('invokes onScroll and onStop', () => {
        const el = scrollableElement();
        const onScroll = vi.fn();
        const onStop = vi.fn();
        useScroll(el, { onScroll, onStop, idle: 50 });

        el.dispatchEvent(new Event('scroll'));
        expect(onScroll).toHaveBeenCalledTimes(1);
        expect(onStop).not.toHaveBeenCalled();
        vi.advanceTimersByTime(50);
        expect(onStop).toHaveBeenCalledTimes(1);
    });
});
