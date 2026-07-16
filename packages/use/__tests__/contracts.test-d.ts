// Typing contracts: the /web implementations must satisfy the platform-
// neutral signatures exported from the root, so a Lynx implementation with
// the same signatures is drop-in for cross-platform app code.
import { describe, expectTypeOf, it } from 'vitest';
import type {
    ColorScheme,
    MaybeSignal,
    NetworkState,
    ReadSignal,
    UseClipboardReturn,
    WindowSizeState
} from '@sigx/use';
import { toValue, useToggle } from '@sigx/use';
import { useClipboard, useColorScheme, useNetwork, useOnline, useWindowSize } from '@sigx/use/web';
import { computed, signal } from '@sigx/reactivity';

describe('cross-platform contracts', () => {
    it('web implementations satisfy the shared contracts', () => {
        expectTypeOf(useColorScheme()).toExtend<ReadSignal<ColorScheme>>();
        expectTypeOf(useOnline()).toExtend<ReadSignal<boolean>>();
        expectTypeOf(useClipboard()).toExtend<UseClipboardReturn>();
        expectTypeOf(useWindowSize()).toExtend<Readonly<WindowSizeState>>();
        expectTypeOf(useNetwork()).toExtend<Readonly<NetworkState>>();
    });

    it('ReadSignal preserves literal unions where PrimitiveSignal widens', () => {
        expectTypeOf(useColorScheme().value).toEqualTypeOf<ColorScheme>();
    });

    it('toValue accepts every MaybeSignal arm', () => {
        expectTypeOf(toValue(1)).toBeNumber();
        expectTypeOf(toValue(signal(1))).toBeNumber();
        expectTypeOf(toValue(computed(() => 1))).toBeNumber();
        expectTypeOf(toValue(() => 1)).toBeNumber();
        const source: MaybeSignal<string> = 'x';
        expectTypeOf(toValue(source)).toBeString();
    });

    it('useToggle overloads', () => {
        const [state, toggle] = useToggle();
        expectTypeOf(state.value).toBeBoolean();
        expectTypeOf(toggle(true)).toBeBoolean();
        expectTypeOf(useToggle(signal(false))).toBeFunction();
    });
});
