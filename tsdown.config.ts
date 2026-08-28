import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ['src/index.ts'],
    outDir: 'dist',
    format: ['esm', 'cjs'],
    platform: 'node',
    target: 'node22',
    clean: true,
    dts: {
        sourcemap: true,
    },
    sourcemap: true,
    deps: {
        neverBundle: ['moleculer'],
    },
    failOnWarn: true,
});
