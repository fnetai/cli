#!/usr/bin/env node

/**
 * Postinstall script for @fnet/cli
 *
 * Downloads pre-compiled native binaries from GitHub Releases
 * and installs them to ~/.fnet/bin/
 *
 * Fail-safe: if download fails (offline, CI, etc.), silently continues.
 * The JS-based CLI commands will still work as fallback.
 */

import { createWriteStream, mkdirSync, chmodSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir, platform, arch } from 'os';
import { execSync } from 'child_process';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGunzip } from 'zlib';

const REPO = 'fnetai/cli';
const BINARIES = ['frun', 'fbin', 'fservice'];
const INSTALL_DIR = join(homedir(), '.fnet', 'bin');

function getPlatform() {
  const p = platform();
  switch (p) {
    case 'darwin': return 'darwin';
    case 'linux': return 'linux';
    case 'win32': return 'windows';
    default: return null;
  }
}

function getArch() {
  const a = arch();
  switch (a) {
    case 'arm64': return 'arm64';
    case 'x64': return 'x64';
    default: return null;
  }
}

async function download(url, dest) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const fileStream = createWriteStream(dest);
  const reader = response.body.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fileStream.write(value);
    }
  } finally {
    fileStream.end();
    await new Promise((resolve) => fileStream.on('close', resolve));
  }
}

async function extractTarGz(archive, destDir, binaryName) {
  execSync(`tar -xzf "${archive}" -C "${destDir}"`, { stdio: 'ignore' });
}

async function extractZip(archive, destDir) {
  execSync(`unzip -o "${archive}" -d "${destDir}"`, { stdio: 'ignore' });
}

async function main() {
  const os = getPlatform();
  const architecture = getArch();

  if (!os || !architecture) {
    // Unsupported platform, skip silently
    return;
  }

  // Read version from package.json
  let version;
  try {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    const pkg = require('../package.json');
    version = pkg.version;
  } catch {
    return; // Can't determine version, skip
  }

  const tag = `v${version}`;
  const ext = os === 'windows' ? 'zip' : 'tar.gz';

  // Create install directory
  mkdirSync(INSTALL_DIR, { recursive: true });

  const baseUrl = `https://github.com/${REPO}/releases/download/${tag}`;

  console.log(`\n  Flownet CLI: installing native binaries (${os}-${architecture})...\n`);

  let installed = 0;

  for (const bin of BINARIES) {
    const archiveName = `${bin}-${os}-${architecture}.${ext}`;
    const url = `${baseUrl}/${archiveName}`;
    const tmpFile = join(INSTALL_DIR, archiveName);

    try {
      await download(url, tmpFile);

      if (ext === 'tar.gz') {
        await extractTarGz(tmpFile, INSTALL_DIR, bin);
      } else {
        await extractZip(tmpFile, INSTALL_DIR);
      }

      // Set executable permission (non-windows)
      if (os !== 'windows') {
        chmodSync(join(INSTALL_DIR, bin), 0o755);
      }

      // Cleanup archive
      unlinkSync(tmpFile);
      console.log(`    ✓ ${bin}`);
      installed++;
    } catch {
      // Fail silently — JS fallback will work
      try { unlinkSync(tmpFile); } catch {}
    }
  }

  if (installed > 0) {
    console.log(`\n  ${installed} binary installed to ${INSTALL_DIR}`);

    // Check PATH
    const pathDirs = (process.env.PATH || '').split(':');
    if (!pathDirs.includes(INSTALL_DIR)) {
      console.log(`\n  Add to your shell profile for native binary support:`);
      console.log(`    export PATH="${INSTALL_DIR}:$PATH"\n`);
    } else {
      console.log('');
    }
  }
}

main().catch(() => {
  // Fail completely silently — JS fallback always works
});
