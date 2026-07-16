import { describe, it, expect } from 'vitest';
import { computed, signal, toSignal } from '@sigx/reactivity';
import { toValue } from '@sigx/use';

describe('toValue', () => {
    it('passes plain values through', () => {
        expect(toValue(42)).toBe(42);
        expect(toValue('x')).toBe('x');
        expect(toValue(null)).toBe(null);
        expect(toValue(undefined)).toBe(undefined);
        const obj = { a: 1 };
        expect(toValue(obj)).toBe(obj);
    });

    it('calls getters', () => {
        expect(toValue(() => 42)).toBe(42);
    });

    it('unwraps primitive signals, computeds and property views', () => {
        expect(toValue(signal(42))).toBe(42);
        expect(toValue(computed(() => 'a'))).toBe('a');

        const state = signal({ count: 7 });
        expect(toValue(toSignal(state, 'count'))).toBe(7);
    });

    it('passes plain { value } objects through (documented caveat)', () => {
        const valueShaped = { value: 1 };
        expect(toValue(valueShaped as unknown as number)).toBe(valueShaped);
    });

    it('tracks when read inside a reactive context', () => {
        const source = signal(1);
        const doubled = computed(() => toValue(source) * 2);
        expect(doubled.value).toBe(2);
        source.value = 5;
        expect(doubled.value).toBe(10);
    });
});
