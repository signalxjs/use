import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packagesDir = join(__dirname, '..', 'packages');

const arg = process.argv[2] || 'patch';

// Check if arg is a version number (e.g., "0.2.0", "1.0.0-beta.1") or bump type
const isExactVersion = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(arg);
const bumpType = isExactVersion ? null : arg;
const exactVersion = isExactVersion ? arg : null;
if (bumpType && !['major', 'minor', 'patch'].includes(bumpType)) {
    console.error(`❌ Unknown bump type or invalid version: "${arg}" (expected major|minor|patch or x.y.z)`);
    process.exit(1);
}

function bumpVersion(version, type) {
    // Bump from the release base; a prerelease suffix (1.0.0-beta.1) is dropped.
    const parts = version.split('-')[0].split('.').map(Number);
    switch (type) {
        case 'major':
            return `${parts[0] + 1}.0.0`;
        case 'minor':
            return `${parts[0]}.${parts[1] + 1}.0`;
        case 'patch':
        default:
            return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    }
}

// The single-minor peer range for a sibling at `version` — e.g. 0.3.0 or
// 0.3.1 → ">=0.3.0 <0.4.0". Sibling packages keep module-level state
// singleton, so a pack must peer on exactly one minor of the sibling it ships
// with. The lower bound floors to `.0`: patches within a minor stay
// compatible, so a patch bump must not tighten the range (a >=0.3.1 lower
// bound would reject an already-installed sibling at 0.3.0).
function siblingPeerRange(version) {
    const [major, minor] = version.split('-')[0].split('.').map(Number);
    return `>=${major}.${minor}.0 <${major}.${minor + 1}.0`;
}

// First pass: map every public (versioned) package name to the version it is
// about to receive, so sibling peer ranges can be rewritten in lockstep.
function collectSiblingVersions(dir) {
    const versions = new Map();
    for (const entry of readdirSync(dir)) {
        const fullPath = join(dir, entry);
        if (!statSync(fullPath).isDirectory()) continue;
        try {
            const pkg = JSON.parse(readFileSync(join(fullPath, 'package.json'), 'utf-8'));
            if (pkg.private) continue;
            versions.set(pkg.name, exactVersion || bumpVersion(pkg.version, bumpType));
        } catch (e) {
            // No package.json, skip
        }
    }
    return versions;
}

function processPackages(dir, siblingVersions) {
    const entries = readdirSync(dir);

    for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
            const pkgPath = join(fullPath, 'package.json');
            try {
                const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
                if (pkg.private) {
                    console.log(`Skipping private package: ${pkg.name}`);
                    continue;
                }
                const oldVersion = pkg.version;
                const newVersion = exactVersion || bumpVersion(oldVersion, bumpType);
                pkg.version = newVersion;
                // Keep sibling peer ranges in lockstep: a concrete range on a
                // workspace sibling (e.g. use-web → @sigx/use) must track the
                // sibling's new version, or the pack rejects the sibling it
                // ships with. `catalog:`/`workspace:` protocol ranges resolve
                // themselves and are left untouched.
                if (pkg.peerDependencies) {
                    for (const [dep, range] of Object.entries(pkg.peerDependencies)) {
                        const siblingVersion = siblingVersions.get(dep);
                        if (
                            siblingVersion &&
                            !range.startsWith('catalog:') &&
                            !range.startsWith('workspace:')
                        ) {
                            const newRange = siblingPeerRange(siblingVersion);
                            if (newRange !== range) {
                                pkg.peerDependencies[dep] = newRange;
                                console.log(`  peer ${dep}: ${range} → ${newRange}`);
                            }
                        }
                    }
                }
                writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + '\n');
                console.log(`${pkg.name}: ${oldVersion} → ${newVersion}`);
            } catch (e) {
                // No package.json, skip
            }
        }
    }
}

if (exactVersion) {
    console.log(`Setting all packages to version ${exactVersion}...\n`);
} else {
    console.log(`Bumping ${bumpType} version for packages...\n`);
}
processPackages(packagesDir, collectSiblingVersions(packagesDir));
console.log('\nDone!');
