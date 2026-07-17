import { describe, it, expect, vi } from 'vitest';
import { effectScope, signal } from '@sigx/reactivity';
import { useEventListener } from '@sigx/use-web';

describe('useEventListener', () => {
    it('defaults to window and fires', () => {
        const listener = vi.fn();
        const stop = useEventListener('resize', listener);
        window.dispatchEvent(new Event('resize'));
        expect(listener).toHaveBeenCalledTimes(1);
        stop();
        window.dispatchEvent(new Event('resize'));
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('attaches to an explicit element and supports event arrays', () => {
        const el = document.createElement('button');
        const listener = vi.fn();
        useEventListener(el, ['focus', 'blur'], listener);
        el.dispatchEvent(new Event('focus'));
        el.dispatchEvent(new Event('blur'));
        expect(listener).toHaveBeenCalledTimes(2);
    });

    it('re-attaches when a reactive target changes elements', () => {
        const first = document.createElement('div');
        const second = document.createElement('div');
        const target = signal<HTMLElement | null>(null);
        const listener = vi.fn();
        useEventListener(target, 'click', listener);

        first.dispatchEvent(new Event('click'));
        expect(listener).not.toHaveBeenCalled();

        target.value = first;
        first.dispatchEvent(new Event('click'));
        expect(listener).toHaveBeenCalledTimes(1);

        target.value = second;
        first.dispatchEvent(new Event('click')); // detached from first
        expect(listener).toHaveBeenCalledTimes(1);
        second.dispatchEvent(new Event('click'));
        expect(listener).toHaveBeenCalledTimes(2);
    });

    it('detaches when the owning scope stops', () => {
        const el = document.createElement('div');
        const listener = vi.fn();
        const scope = effectScope();
        scope.run(() => useEventListener(el, 'click', listener));
        el.dispatchEvent(new Event('click'));
        expect(listener).toHaveBeenCalledTimes(1);

        scope.stop();
        el.dispatchEvent(new Event('click'));
        expect(listener).toHaveBeenCalledTimes(1);
    });
});
