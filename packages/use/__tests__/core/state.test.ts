import { describe, it, expect } from 'vitest';
import { effect, signal } from '@sigx/reactivity';
import { useCounter, useCycleList, usePrevious, useToggle } from '@sigx/use';

describe('useToggle', () => {
    it('flips with no argument, sets with a boolean', () => {
        const [state, toggle] = useToggle(false);
        expect(state.value).toBe(false);
        expect(toggle()).toBe(true);
        expect(state.value).toBe(true);
        expect(toggle(true)).toBe(true);
        expect(toggle(false)).toBe(false);
    });

    it('defaults to false', () => {
        const [state] = useToggle();
        expect(state.value).toBe(false);
    });

    it('binds a toggler to an existing signal', () => {
        const open = signal(true);
        const toggle = useToggle(open);
        expect(toggle()).toBe(false);
        expect(open.value).toBe(false);
    });
});

describe('useCounter', () => {
    it('increments, decrements, sets and resets', () => {
        const { count, inc, dec, set, reset } = useCounter(5);
        expect(count.value).toBe(5);
        expect(inc()).toBe(6);
        expect(inc(4)).toBe(10);
        expect(dec(3)).toBe(7);
        expect(set(1)).toBe(1);
        expect(reset()).toBe(5);
        expect(reset(2)).toBe(2);
    });

    it('clamps mutations to [min, max]', () => {
        const { inc, dec } = useCounter(0, { min: 0, max: 3 });
        expect(dec(5)).toBe(0);
        expect(inc(99)).toBe(3);
    });

    it('clamps the initial value', () => {
        const { count } = useCounter(-10, { min: 0 });
        expect(count.value).toBe(0);
    });
});

describe('usePrevious', () => {
    it('lags the source by one change', () => {
        const count = signal(0);
        const prev = usePrevious(count);
        expect(prev.value).toBe(undefined);
        count.value = 5;
        expect(prev.value).toBe(0);
        count.value = 9;
        expect(prev.value).toBe(5);
    });

    it('honors initialValue and preserves object identity', () => {
        const first = { id: 1 };
        const second = { id: 2 };
        const source = signal<number>(0);
        const objects = [first, second];
        const pick = () => objects[source.value];
        const prev = usePrevious(pick, first);
        expect(prev.value).toBe(first);
        source.value = 1;
        expect(prev.value).toBe(first); // exact same reference, no proxying
    });

    it('is reactive downstream', () => {
        const count = signal(0);
        const prev = usePrevious(count);
        const seen: Array<number | undefined> = [];
        effect(() => seen.push(prev.value));
        count.value = 1;
        count.value = 2;
        expect(seen).toEqual([undefined, 0, 1]);
    });
});

describe('useCycleList', () => {
    it('cycles forward and back with wrap-around', () => {
        const { state, index, next, prev } = useCycleList(['a', 'b', 'c']);
        expect(state.value).toBe('a');
        expect(next()).toBe('b');
        expect(index.value).toBe(1);
        expect(next(2)).toBe('a'); // wraps
        expect(prev()).toBe('c');  // wraps backwards
        expect(state.value).toBe('c');
    });

    it('respects initialValue and go()', () => {
        const { state, go } = useCycleList(['a', 'b', 'c'], { initialValue: 'b' });
        expect(state.value).toBe('b');
        expect(go(5)).toBe('c'); // 5 wraps to index 2
    });

    it('keeps the last value and no-ops go() while a reactive list is empty', () => {
        const list = signal<string[]>(['a', 'b']);
        const { state, index, next } = useCycleList(() => [...list]);
        next(); // 'b'
        list.$set([]);
        expect(state.value).toBe('b'); // last known value retained
        expect(index.value).toBe(-1);
        expect(next()).toBe('b');      // go() no-ops on empty lists
        list.$set(['x', 'b']);
        expect(index.value).toBe(1);   // recovers once the list refills
    });

    it('falls back when a reactive list no longer contains the value', () => {
        const list = signal(['a', 'b', 'c']);
        const { state, next } = useCycleList(() => [...list]);
        next(); // 'b'
        list.$set(['x', 'y']);
        expect(state.value).toBe('x'); // fallbackIndex 0
    });
});
