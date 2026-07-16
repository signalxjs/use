import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { effectScope, signal } from '@sigx/reactivity';
import { watchDebounced, watchThrottled } from '@sigx/use';

beforeEach(() => {
    vi.useFakeTimers();
});
afterEach(() => {
    vi.useRealTimers();
});

describe('watchDebounced', () => {
    it('collapses bursts into one callback with the latest value', () => {
        const source = signal(0);
        const cb = vi.fn();
        watchDebounced(source, cb, { debounce: 100 });

        source.value = 1;
        source.value = 2;
        source.value = 3;
        expect(cb).not.toHaveBeenCalled();
        vi.advanceTimersByTime(100);
        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb.mock.calls[0][0]).toBe(3);
    });

    it('runs onCleanup before the next invocation and on stop', () => {
        const source = signal(0);
        const cleanup = vi.fn();
        const handle = watchDebounced(
            source,
            (_v, _o, onCleanup) => onCleanup(cleanup),
            { debounce: 50 }
        );

        source.value = 1;
        vi.advanceTimersByTime(50); // first run registers cleanup
        expect(cleanup).not.toHaveBeenCalled();

        source.value = 2;
        vi.advanceTimersByTime(50); // second run — previous cleanup fires first
        expect(cleanup).toHaveBeenCalledTimes(1);

        handle.stop();
        expect(cleanup).toHaveBeenCalledTimes(2);
    });

    it('stop() (callable handle) cancels pending runs', () => {
        const source = signal(0);
        const cb = vi.fn();
        const handle = watchDebounced(source, cb, { debounce: 100 });
        source.value = 1;
        handle(); // callable stop
        vi.advanceTimersByTime(500);
        expect(cb).not.toHaveBeenCalled();
    });

    it('pause/resume suspend watching', () => {
        const source = signal(0);
        const cb = vi.fn();
        const handle = watchDebounced(source, cb, { debounce: 10 });
        handle.pause();
        source.value = 1;
        vi.advanceTimersByTime(50);
        expect(cb).not.toHaveBeenCalled();
        handle.resume();
        source.value = 2;
        vi.advanceTimersByTime(10);
        expect(cb).toHaveBeenCalledTimes(1);
    });

    it('cancels pending runs when the owning scope disposes', () => {
        const source = signal(0);
        const cb = vi.fn();
        const scope = effectScope();
        scope.run(() => watchDebounced(source, cb, { debounce: 100 }));
        source.value = 1;
        scope.stop();
        vi.advanceTimersByTime(500);
        expect(cb).not.toHaveBeenCalled();
    });
});

describe('watchThrottled', () => {
    it('runs at most once per window with the latest value', () => {
        const source = signal(0);
        const cb = vi.fn();
        watchThrottled(source, cb, { throttle: 100 });

        source.value = 1; // leading
        expect(cb).toHaveBeenCalledTimes(1);
        source.value = 2;
        source.value = 3;
        expect(cb).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(100); // trailing
        expect(cb).toHaveBeenCalledTimes(2);
        expect(cb.mock.calls[1][0]).toBe(3);
    });

    it('honors watch options (immediate)', () => {
        const source = signal(5);
        const cb = vi.fn();
        watchThrottled(source, cb, { throttle: 100, immediate: true });
        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb.mock.calls[0][0]).toBe(5);
    });
});
