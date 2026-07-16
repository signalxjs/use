import { describe, it, expect, vi } from 'vitest';
import { effectScope, signal } from '@sigx/reactivity';
import { createGlobalState, createSharedComposable, tryOnScopeDispose } from '@sigx/use';

describe('createGlobalState', () => {
    it('runs the factory once and returns the same state to every caller', () => {
        const factory = vi.fn(() => signal({ q: '' }));
        const useGlobal = createGlobalState(factory);

        const a = useGlobal();
        const b = useGlobal();
        expect(a).toBe(b);
        expect(factory).toHaveBeenCalledTimes(1);
    });

    it('survives the disposal of a caller scope (detached)', () => {
        const useGlobal = createGlobalState(() => signal(0));
        const scope = effectScope();
        const inside = scope.run(() => useGlobal());
        scope.stop();
        expect(useGlobal()).toBe(inside);
    });
});

describe('createSharedComposable', () => {
    it('shares one instance across subscribers and tears down after the last one', () => {
        let setups = 0;
        let teardowns = 0;
        const useThing = createSharedComposable(() => {
            setups += 1;
            tryOnScopeDispose(() => {
                teardowns += 1;
            });
            return signal(setups);
        });

        const scopeA = effectScope();
        const scopeB = effectScope();
        const a = scopeA.run(() => useThing());
        const b = scopeB.run(() => useThing());
        expect(a).toBe(b);
        expect(setups).toBe(1);

        scopeA.stop();
        expect(teardowns).toBe(0); // still one subscriber

        scopeB.stop();
        expect(teardowns).toBe(1); // last one out stops the shared scope

        // next subscriber re-creates the state
        const scopeC = effectScope();
        const c = scopeC.run(() => useThing());
        expect(setups).toBe(2);
        expect(c).not.toBe(a);
        scopeC.stop();
    });
});
