import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const expectedExports = [
    'action',
    'created',
    'defineSettings',
    'event',
    'lifecycle',
    'merged',
    'method',
    'service',
    'started',
    'stopped',
];

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'moldecor-package-'));

try {
    const output = execFileSync(
        'npm',
        ['pack', '--json', '--ignore-scripts', '--pack-destination', temporaryDirectory],
        {
            encoding: 'utf8',
            env: {
                ...process.env,
                npm_config_cache: join(temporaryDirectory, 'npm-cache'),
            },
        },
    );
    const [manifest] = JSON.parse(output);
    const tarball = join(temporaryDirectory, manifest.filename);
    execFileSync('tar', ['-xzf', tarball, '-C', temporaryDirectory]);

    const packageDirectory = join(temporaryDirectory, 'package');
    const esm = await import(pathToFileURL(join(packageDirectory, 'dist/index.mjs')).href);
    const require = createRequire(import.meta.url);
    const cjs = require(join(packageDirectory, 'dist/index.cjs'));

    assert.deepEqual(Object.keys(esm).sort(), expectedExports);
    assert.deepEqual(Object.keys(cjs).sort(), expectedExports);

    const files = manifest.files.map(({ path }) => path);
    const allowedRootFiles = new Set(['CHANGELOG.md', 'LICENSE', 'README.md', 'package.json']);

    assert(files.some((path) => path === 'dist/index.mjs'));
    assert(files.some((path) => path === 'dist/index.cjs'));
    assert(files.some((path) => path === 'dist/index.d.mts'));
    assert(files.some((path) => path === 'dist/index.d.cts'));
    assert(
        files.every((path) => path.startsWith('dist/') || allowedRootFiles.has(path)),
        `Unexpected files in npm tarball: ${files.join(', ')}`,
    );

    console.log(`Validated ${files.length} npm package files and both module formats.`);
} finally {
    rmSync(temporaryDirectory, { force: true, recursive: true });
}
