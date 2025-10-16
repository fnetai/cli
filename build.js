#!/usr/bin/env bun

import { rmSync, existsSync, readFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { watch } from 'node:fs';

const DEVELOPMENT = !!process.env.DEVELOPMENT;
const WATCH_MODE = process.argv.includes('--watch');

// Read package.json to get dependencies
const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const externalPackages = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
];

// CLI configurations
const cliConfigs = [
  {
    name: 'fnet',
    entry: 'src/fnet-cli/index.js',
    outdir: 'dist/fnet',
  },
  {
    name: 'fnode',
    entry: 'src/fnode-cli/index.js',
    outdir: 'dist/fnode',
  },
  {
    name: 'frun',
    entry: 'src/frun-cli/index.js',
    outdir: 'dist/frun',
  },
  {
    name: 'fbin',
    entry: 'src/fbin-cli/index.js',
    outdir: 'dist/fbin',
  },
  {
    name: 'fservice',
    entry: 'src/fservice-cli/index.js',
    outdir: 'dist/fservice',
  },
];

// Clean dist directories
function cleanDist(outdir) {
  if (existsSync(outdir)) {
    console.log(`🧹 Cleaning ${outdir}...`);
    rmSync(outdir, { recursive: true, force: true });
  }
}

// Build a single CLI
async function buildCLI(config) {
  const { name, entry, outdir } = config;
  
  console.log(`📦 Building ${name}...`);
  
  // Clean output directory
  cleanDist(outdir);
  
  try {
    const result = await Bun.build({
      entrypoints: [entry],
      outdir,
      target: 'bun',
      format: 'esm',
      splitting: true,
      minify: !DEVELOPMENT,
      sourcemap: DEVELOPMENT ? 'inline' : 'none',
      // Mark all dependencies as external (don't bundle node_modules)
      external: externalPackages,
      naming: {
        entry: 'index.js',
        chunk: 'index.[hash].js',
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify(DEVELOPMENT ? 'development' : 'production'),
      },
    });

    if (!result.success) {
      console.error(`❌ Failed to build ${name}:`);
      for (const log of result.logs) {
        console.error(log);
      }
      process.exit(1);
    }

    // Add shebang to entry file and make it executable
    const entryFile = join(outdir, 'index.js');
    if (existsSync(entryFile)) {
      const content = await Bun.file(entryFile).text();
      const withShebang = `#!/usr/bin/env node\n${content}`;
      // const withShebang = `#!/usr/bin/env node\n${content}`;
      await Bun.write(entryFile, withShebang);
      // Make the file executable (chmod +x)
      chmodSync(entryFile, 0o755);
    }

    console.log(`✅ ${name} built successfully`);
  } catch (error) {
    console.error(`❌ Error building ${name}:`, error);
    process.exit(1);
  }
}

// Build all CLIs
async function buildAll() {
  console.log(`🚀 Building in ${DEVELOPMENT ? 'DEVELOPMENT' : 'PRODUCTION'} mode\n`);

  const startTime = Date.now();

  // Build all CLIs in parallel
  await Promise.all(cliConfigs.map(config => buildCLI(config)));

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✨ All builds completed in ${duration}s`);
}

// Watch mode
function startWatch() {
  console.log('👀 Watch mode enabled - watching for changes...\n');

  let isBuilding = false;
  let pendingRebuild = false;

  const rebuild = async () => {
    if (isBuilding) {
      pendingRebuild = true;
      return;
    }

    isBuilding = true;
    pendingRebuild = false;

    try {
      await buildAll();
    } catch (error) {
      console.error('❌ Build failed:', error);
    }

    isBuilding = false;

    if (pendingRebuild) {
      rebuild();
    }
  };

  // Watch src directory
  const watcher = watch('src', { recursive: true }, (_eventType, filename) => {
    if (filename && filename.endsWith('.js')) {
      console.log(`\n📝 File changed: ${filename}`);
      rebuild();
    }
  });

  // Handle cleanup on exit
  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping watch mode...');
    watcher.close();
    process.exit(0);
  });
}

// Run the build
if (WATCH_MODE) {
  buildAll()
    .then(() => startWatch())
    .catch(error => {
      console.error('❌ Build failed:', error);
      process.exit(1);
    });
} else {
  buildAll().catch(error => {
    console.error('❌ Build failed:', error);
    process.exit(1);
  });
}

