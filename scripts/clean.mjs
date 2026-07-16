#!/usr/bin/env node
// Cross-platform clean (repo convention: Node scripts over shell one-liners —
// `rm -rf` breaks on Windows shells).
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const packagesDir = join(rootDir, 'packages');

const targets = ['node_modules', 'pnpm-lock.yaml'];
if (existsSync(packagesDir)) {
    for (const pkg of readdirSync(packagesDir)) {
        targets.push(join('packages', pkg, 'dist'), join('packages', pkg, 'node_modules'));
    }
}
for (const target of targets) {
    const path = join(rootDir, target);
    if (!existsSync(path)) continue;
    rmSync(path, { recursive: true, force: true });
    console.log(`removed ${target}`);
}
