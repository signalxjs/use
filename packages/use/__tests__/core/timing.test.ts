import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { effectScope, signal } from '@sigx/reactivity';
import {
    useDebouncedSignal,
    useIntervalFn,
    useNow,
    useThrottledSignal,
    useTimeoutFn
} from '@sigx/use';

beforeEach(() => {
    vi.useFakeTimers();
});
afterEach(() => {
    vi.useRealTimers();
});

describe('useIntervalFn', () => {
    it('runs the callback on each interval and pauses/resumes', () => {
        const cb = vi.fn();
        const { pause, resume, isActive } = useIntervalFn(cb, 100);
        expect(isActive.value).toBe(true);

        vi.advanceTimersByTime(350);
        expect(cb).toHaveBeenCalledTimes(3);

        pause();
        expect(isActive.value).toBe(false);
        vi.advanceTimersByTime(500);
        expect(cb).toHaveBeenCalledTimes(3);

        resume();
        vi.advanceTimersByTime(100);
        expect(cb).toHaveBeenCalledTimes(4);
    });

    it('supports immediate: false and immediateCallback', () => {
        const cb = vi.fn();
        const { resume, isActive } = useIntervalFn(cb, 100, {
            immediate: false,
            immediateCallback: true
        });
        expect(isActive.value).toBe(false);
        vi.advanceTimersByTime(300);
        expect(cb).not.toHaveBeenCalled();

        resume();
        expect(cb).toHaveBeenCalledTimes(1); // immediateCallback
        vi.advanceTimersByTime(100);
        expect(cb).toHaveBeenCalledTimes(2);
    });

    it('restarts when a reactive interval changes', () => {
        const cb = vi.fn();
        const interval = signal(100);
        useIntervalFn(cb, interval);

        vi.advanceTimersByTime(100);
        expect(cb).toHaveBeenCalledTimes(1);

        interval.value = 500;
        vi.advanceTimersByTime(400);
        expect(cb).toHaveBeenCalledTimes(1); // restarted with the new period
        vi.advanceTimersByTime(100);
        expect(cb).toHaveBeenCalledTimes(2);
    });

    it('clears with the owning scope', () => {
        const cb = vi.fn();
        const scope = effectScope();
        scope.run(() => useIntervalFn(cb, 100));
        vi.advanceTimersByTime(200);
        expect(cb).toHaveBeenCalledTimes(2);

        scope.stop();
        vi.advanceTimersByTime(1000);
        expect(cb).toHaveBeenCalledTimes(2);
    });
});

describe('useTimeoutFn', () => {
    it('fires once after ms, restartable, isPending tracks state', () => {
        const cb = vi.fn();
        const { isPending, start } = useTimeoutFn(cb, 100, { immediate: false });
        expect(isPending.value).toBe(false);

        start();
        expect(isPending.value).toBe(true);
        vi.advanceTimersByTime(60);
        start(); // re-arm replaces the pending run
        vi.advanceTimersByTime(60);
        expect(cb).not.toHaveBeenCalled();
        vi.advanceTimersByTime(40);
        expect(cb).toHaveBeenCalledTimes(1);
        expect(isPending.value).toBe(false);
    });

    it('passes start() arguments to the callback', () => {
        const cb = vi.fn();
        const { start } = useTimeoutFn<[string, number]>(cb, 50, { immediate: false });
        start('a', 1);
        vi.advanceTimersByTime(50);
        expect(cb).toHaveBeenCalledWith('a', 1);
    });

    it('arms immediately by default and stop() cancels', () => {
        const cb = vi.fn();
        const { stop, isPending } = useTimeoutFn(cb, 100);
        expect(isPending.value).toBe(true);
        stop();
        vi.advanceTimersByTime(500);
        expect(cb).not.toHaveBeenCalled();
    });

    it('cancels with the owning scope', () => {
        const cb = vi.fn();
        const scope = effectScope();
        scope.run(() => useTimeoutFn(cb, 100));
        scope.stop();
        vi.advanceTimersByTime(500);
        expect(cb).not.toHaveBeenCalled();
    });
});

describe('useDebouncedSignal', () => {
    it('trails the source, collapsing bursts', () => {
        const source = signal('');
        const debounced = useDebouncedSignal(source, 100);
        expect(debounced.value).toBe('');

        source.value = 'a';
        source.value = 'ab';
        vi.advanceTimersByTime(60);
        expect(debounced.value).toBe('');
        source.value = 'abc';
        vi.advanceTimersByTime(99);
        expect(debounced.value).toBe('');
        vi.advanceTimersByTime(1);
        expect(debounced.value).toBe('abc');
    });

    it('honors maxWait', () => {
        const source = signal(0);
        const debounced = useDebouncedSignal(source, 100, { maxWait: 250 });
        // keep changing faster than the debounce window
        for (let i = 1; i <= 6; i++) {
            source.value = i;
            vi.advanceTimersByTime(50);
        }
        // 300ms elapsed — maxWait must have flushed an update
        expect(debounced.value).toBeGreaterThan(0);
    });

    it('cancels the pending update on scope dispose', () => {
        const source = signal(0);
        const scope = effectScope();
        let debounced!: ReturnType<typeof useDebouncedSignal<number>>;
        scope.run(() => {
            debounced = useDebouncedSignal(source, 100);
        });
        source.value = 7;
        scope.stop();
        vi.advanceTimersByTime(500);
        expect(debounced.value).toBe(0);
    });
});

describe('useThrottledSignal', () => {
    it('updates at most once per window, with leading and trailing', () => {
        const source = signal(0);
        const throttled = useThrottledSignal(source, 100);

        source.value = 1; // leading — immediate
        expect(throttled.value).toBe(1);

        source.value = 2;
        source.value = 3;
        expect(throttled.value).toBe(1);
        vi.advanceTimersByTime(100);
        expect(throttled.value).toBe(3); // trailing delivers the latest
    });

    it('supports leading: false', () => {
        const source = signal(0);
        const throttled = useThrottledSignal(source, 100, { leading: false });
        source.value = 1;
        expect(throttled.value).toBe(0);
        vi.advanceTimersByTime(100);
        expect(throttled.value).toBe(1);
    });
});

describe('useNow', () => {
    it('updates every interval', () => {
        vi.setSystemTime(new Date('2026-07-16T12:00:00Z'));
        const now = useNow({ interval: 1000 });
        const first = now.value.getTime();
        vi.advanceTimersByTime(3000);
        expect(now.value.getTime()).toBe(first + 3000);
        expect(now.value).toBeInstanceOf(Date);
    });

    it('returns Pausable controls with { controls: true }', () => {
        vi.setSystemTime(new Date('2026-07-16T12:00:00Z'));
        const { now, pause, isActive } = useNow({ controls: true });
        expect(isActive.value).toBe(true);
        const first = now.value.getTime();
        pause();
        vi.advanceTimersByTime(5000);
        expect(now.value.getTime()).toBe(first);
    });
});
