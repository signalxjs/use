import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

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
            // Subpath alias must precede the bare one, or '@sigx/use' would
            // swallow '@sigx/use/web' imports.
            '@sigx/use/web': resolve(__dirname, 'packages/use/src/web/index.ts'),
            '@sigx/use': resolve(__dirname, 'packages/use/src/index.ts')
        }
    }
});
