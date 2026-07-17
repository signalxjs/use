import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
    test: {
        environment: 'happy-dom',
        include: ['packages/**/__tests__/**/*.test.ts'],
        exclude: ['**/node_modules/**'],
        globals: true,
        typecheck: {
            // Enforce the *.test-d.ts typing-contract files on every test run.
            enabled: true,
            include: ['packages/**/__tests__/**/*.test-d.ts'],
        },
    },
    resolve: {
        alias: {
            // Longest-prefix aliases first, or '@sigx/use' would swallow
            // '@sigx/use-web' and '@sigx/use/internals' imports.
            '@sigx/use-web': here('packages/use-web/src/index.ts'),
            '@sigx/use/internals': here('packages/use/src/internals.ts'),
            '@sigx/use': here('packages/use/src/index.ts')
        }
    }
});
