import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { component, jsx } from '@sigx/runtime-core';
import { render } from '@sigx/runtime-dom';
import { useIntervalFn, useToggle } from '@sigx/use';
import { useEventListener, useMouse } from '@sigx/use-web';

/**
 * End-to-end: composables created during a component's setup are captured by
 * the setup scope and auto-disposed on unmount — no manual stop() anywhere.
 */
describe('composables inside a sigx component', () => {
    let container: HTMLElement;

    beforeEach(() => {
        vi.useFakeTimers();
        container = document.createElement('div');
        document.body.appendChild(container);
    });
    afterEach(() => {
        vi.useRealTimers();
        container.remove();
    });

    it('auto-disposes listeners and timers on unmount', () => {
        const tick = vi.fn();
        const key = vi.fn();
        let mouse!: ReturnType<typeof useMouse>;

        const Demo = component(() => {
            mouse = useMouse({ type: 'client' });
            useIntervalFn(tick, 100);
            useEventListener('keydown', key);
            const [on] = useToggle(true);
            return () => jsx('p', { children: String(on.value) });
        });

        render(jsx(Demo, {}), container);
        expect(container.textContent).toBe('true');

        // Alive while mounted.
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 7, clientY: 3 }));
        expect(mouse.x).toBe(7);
        vi.advanceTimersByTime(200);
        expect(tick).toHaveBeenCalledTimes(2);
        window.dispatchEvent(new KeyboardEvent('keydown'));
        expect(key).toHaveBeenCalledTimes(1);

        // Unmount → everything detaches without any manual stop().
        render(null as never, container);
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 99, clientY: 99 }));
        expect(mouse.x).toBe(7);
        vi.advanceTimersByTime(500);
        expect(tick).toHaveBeenCalledTimes(2);
        window.dispatchEvent(new KeyboardEvent('keydown'));
        expect(key).toHaveBeenCalledTimes(1);
    });
});
