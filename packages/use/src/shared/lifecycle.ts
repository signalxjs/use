// The ONLY file in @sigx/use that may import @sigx/runtime-core, keeping the
// component-lifecycle dependency in one seam.
import { getCurrentInstance, onMounted } from '@sigx/runtime-core';

/**
 * Run `fn` after mount when called during a component's setup; immediately
 * otherwise (standalone scopes, tests, plain scripts).
 *
 * Web composables use this to defer environment reads (storage, layout) to
 * the client-mounted moment without failing outside components.
 */
export function tryOnMounted(fn: () => void): void {
    if (getCurrentInstance()) {
        onMounted(fn);
    } else {
        fn();
    }
}
