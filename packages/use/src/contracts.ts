// ============================================================================
// Cross-platform contracts - type-only, zero runtime
// ============================================================================
// Platform-neutral shapes shared by every platform implementation of the
// same concept: `@sigx/use-web` implements them with browser APIs; a Lynx
// implementation (lynx repo) implements the SAME signatures with native
// bridges. App code written against these contracts ports unchanged.
// This module must stay type-only and DOM-free.

import type { ReadSignal } from './shared/types.js';

/** System color scheme. Matches lynx's `useSystemColorScheme` return shape. */
export type ColorScheme = 'light' | 'dark';

/** Network transport type. Matches lynx-network's `ConnectionType`. */
export type ConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'bluetooth' | 'none' | 'unknown';

/**
 * Platform-neutral network state. Field-for-field match with lynx-network's
 * `NetworkState`; web maps `navigator.onLine` → `isConnected` and reports
 * `isInternetReachable: null` (the web platform cannot know).
 */
export interface NetworkState {
    isConnected: boolean;
    type: ConnectionType;
    isInternetReachable: boolean | null;
}

/** Viewport/window dimensions. */
export interface WindowSizeState {
    width: number;
    height: number;
}

/** Synchronous string storage — implemented by web `localStorage`/`sessionStorage`. */
export interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

/**
 * Asynchronous-read string storage — the shape of Lynx native storage,
 * whose reads are async while writes are fire-and-forget.
 */
export interface StorageLikeAsync {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): void | Promise<void>;
    removeItem(key: string): void | Promise<void>;
}

/** Platform-neutral clipboard surface. */
export interface UseClipboardReturn {
    /** Whether the platform clipboard is available in this context. */
    isSupported: ReadSignal<boolean>;
    /** The last text written through `copy()` (and clipboard reads, where supported). */
    text: ReadSignal<string>;
    /** True for a short window after a successful `copy()` — drive "Copied!" UI with it. */
    copied: ReadSignal<boolean>;
    copy: (text?: string) => Promise<void>;
}
