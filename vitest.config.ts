import ts from 'typescript';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [
        {
            enforce: 'pre',
            name: 'typescript-standard-decorators',
            transform(source, id) {
                if (!id.endsWith('.ts')) return;

                const result = ts.transpileModule(source, {
                    compilerOptions: {
                        module: ts.ModuleKind.ESNext,
                        sourceMap: true,
                        target: ts.ScriptTarget.ES2022,
                    },
                    fileName: id,
                });

                return {
                    code: result.outputText,
                    map: result.sourceMapText,
                };
            },
        },
    ],
    test: {
        include: ['tests/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
            reporter: ['text', 'html', 'lcov'],
            thresholds: {
                branches: 90,
                functions: 90,
                lines: 90,
                statements: 90,
            },
        },
    },
});
