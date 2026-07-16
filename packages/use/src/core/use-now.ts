import { createBox } from '../shared/box.js';
import { useIntervalFn } from './use-interval-fn.js';
import type { Pausable, ReadSignal } from '../shared/types.js';

export interface UseNowOptions<Controls extends boolean = false> {
    /** Update period in ms. Default 1000. */
    interval?: number;
    /** Also return `pause`/`resume`/`isActive` controls. Default false. */
    controls?: Controls;
}

/**
 * The current time as a reactive `Date`, updated every `interval` ms
 * (default 1000). The timer clears with the owning scope.
 *
 * The `Date` is held by reference and replaced wholesale on each tick
 * (`Date` is an exotic built-in sigx deliberately never proxies).
 *
 * Platform: everywhere (setInterval).
 *
 * @example
 * ```ts
 * const now = useNow();
 * const clock = computed(() => now.value.toLocaleTimeString());
 * ```
 */
export function useNow(): ReadSignal<Date>;
export function useNow(options: UseNowOptions<true>): { now: ReadSignal<Date> } & Pausable;
export function useNow(options: UseNowOptions<false>): ReadSignal<Date>;
export function useNow(
    options: UseNowOptions<boolean> = {}
): ReadSignal<Date> | ({ now: ReadSignal<Date> } & Pausable) {
    const { interval = 1000, controls = false } = options;
    const state = createBox(new Date());
    const pausable = useIntervalFn(() => state.set(new Date()), interval, { immediate: true });
    return controls ? { now: state.read, ...pausable } : state.read;
}
