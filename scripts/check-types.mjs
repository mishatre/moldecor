import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const cache = mkdtempSync(join(tmpdir(), 'moldecor-attw-'));

try {
    execFileSync('attw', ['--pack', '.', '--format', 'table'], {
        env: { ...process.env, npm_config_cache: cache },
        stdio: 'inherit',
    });
} finally {
    rmSync(cache, { force: true, recursive: true });
}
