import { computed } from '@sigx/reactivity';
import type { ReadSignal } from '../shared/types.js';
import type { ConfigurableWindow } from './configurable.js';
import { useMediaQuery } from './use-media-query.js';

/** Tailwind CSS default breakpoints. */
export const breakpointsTailwind: Record<'sm' | 'md' | 'lg' | 'xl' | '2xl', number> = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
};

export interface UseBreakpointsReturn<K extends string> {
    /** Viewport strictly wider than the breakpoint. */
    greater: (k: K) => ReadSignal<boolean>;
    /** Viewport at least as wide as the breakpoint (`min-width`). */
    greaterOrEqual: (k: K) => ReadSignal<boolean>;
    /** Viewport strictly narrower than the breakpoint. */
    smaller: (k: K) => ReadSignal<boolean>;
    /** Viewport at most as wide as the breakpoint (`max-width`). */
    smallerOrEqual: (k: K) => ReadSignal<boolean>;
    /** Viewport within `[a, b)`. */
    between: (a: K, b: K) => ReadSignal<boolean>;
    /** The widest breakpoint currently matched, or `''` below the smallest. */
    active: () => ReadSignal<K | ''>;
}

/**
 * Reactive breakpoint queries over a `{ name: width }` map (number = px, or
 * any CSS length string). One `matchMedia` subscription is created lazily per
 * distinct comparison and memoized. SSR: everything false, `active()` is `''`.
 *
 * @example
 * ```ts
 * const bp = useBreakpoints(breakpointsTailwind);
 * const isMobile = bp.smaller('md');
 * ```
 */
export function useBreakpoints<K extends string>(
    breakpoints: Record<K, number | string>,
    options: ConfigurableWindow = {}
): UseBreakpointsReturn<K> {
    const memo = new Map<string, ReadSignal<boolean>>();
    const query = (q: string): ReadSignal<boolean> => {
        let match = memo.get(q);
        if (!match) {
            match = useMediaQuery(q, options);
            memo.set(q, match);
        }
        return match;
    };

    const numeric = (k: K) => Number.parseFloat(String(breakpoints[k]));
    const unit = (k: K) => {
        const value = breakpoints[k];
        return typeof value === 'number' ? 'px' : String(value).replace(String(numeric(k)), '') || 'px';
    };
    const length = (k: K, delta = 0) => `${numeric(k) + delta}${unit(k)}`;

    const greaterOrEqual = (k: K) => query(`(min-width: ${length(k)})`);
    const smaller = (k: K) => query(`(max-width: ${length(k, -0.1)})`);

    return {
        greater: (k) => query(`(min-width: ${length(k, 0.1)})`),
        greaterOrEqual,
        smaller,
        smallerOrEqual: (k) => query(`(max-width: ${length(k)})`),
        between: (a, b) => query(`(min-width: ${length(a)}) and (max-width: ${length(b, -0.1)})`),
        active: () => {
            const sorted = (Object.keys(breakpoints) as K[]).sort((a, b) => numeric(b) - numeric(a));
            const matchers = sorted.map((k) => [k, greaterOrEqual(k)] as const);
            return computed<K | ''>(() => {
                for (const [k, matches] of matchers) {
                    if (matches.value) return k;
                }
                return '';
            });
        }
    };
}
