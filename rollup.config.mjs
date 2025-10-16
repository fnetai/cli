import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve as resolve } from "@rollup/plugin-node-resolve"; // Use named import 'nodeResolve' and alias it
import replace from "@rollup/plugin-replace";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";
import fnetDelete from '@fnet/rollup-plugin-delete';

// process.env access remains the same in ESM within Node.js
const DEVELOPMENT = !!process.env.DEVELOPMENT; // Simplified boolean conversion

const commonPlugins = () => {
  const plugins = [
    json(),
    replace({
      // Ensure values are properly stringified for replacement
      'process.env.NODE_ENV': JSON.stringify(DEVELOPMENT ? 'development' : 'production'),
      // Recommended setting for replace plugin v5+
      preventAssignment: true,
    }),
    resolve({
      // extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
      preferBuiltins: true,
    }),
    commonjs({
      // ignoreDynamicRequires: false, // Keep this if necessary for your CJS dependencies
    }),
  ];

  // Conditional Terser plugin remains the same
  if (!DEVELOPMENT) {
    // Ensure terser() is called to get the plugin instance
    plugins.push(terser());
  }

  return plugins;
};

// The export default syntax is already ESM compliant
export default [
  {
    input: `src/fnet-cli/index.js`,
    output: {
      format: "esm",
      exports: "auto",
      banner: (chunk) => chunk.isEntry ? '#!/usr/bin/env bun' : '',
      dir: 'dist/fnet',
      entryFileNames: 'index.js',
      chunkFileNames: 'index.[hash].js',
    },
    plugins: [fnetDelete({ targets: ["./dist/fnet/**"] }), ...commonPlugins()],
    external: id => /node_modules/.test(id)
  },
  {
    input: `src/fnode-cli/index.js`,
    output: {
      format: "esm",
      exports: "auto",
      banner: (chunk) => chunk.isEntry ? '#!/usr/bin/env bun' : '',
      dir: 'dist/fnode',
      entryFileNames: 'index.js',
      chunkFileNames: 'index.[hash].js',
    },
    plugins: [fnetDelete({ targets: ["dist/fnode/**"] }), ...commonPlugins()],
    external: id => /node_modules/.test(id)
  },
  {
    input: `src/frun-cli/index.js`,
    output: {
      format: "esm",
      exports: "auto",
      banner: (chunk) => chunk.isEntry ? '#!/usr/bin/env bun' : '',
      dir: 'dist/frun',
      entryFileNames: 'index.js',
      chunkFileNames: 'index.[hash].js',
    },
    plugins: [
      fnetDelete({ targets: ["dist/frun/**"] }),
      ...commonPlugins()
    ],
    external: id => /node_modules/.test(id)
  },
  {
    input: `src/fbin-cli/index.js`,
    output: {
      format: "esm",
      exports: "auto",
      banner: (chunk) => chunk.isEntry ? '#!/usr/bin/env bun' : '',
      dir: 'dist/fbin',
      entryFileNames: 'index.js',
      chunkFileNames: 'index.[hash].js',
    },
    plugins: [
      fnetDelete({ targets: ["dist/fbin/**"] }),
      ...commonPlugins()
    ],
    external: id => /node_modules/.test(id)
  },
  {
    input: `src/fservice-cli/index.js`,
    output: {
      format: "esm",
      exports: "auto",
      banner: (chunk) => chunk.isEntry ? '#!/usr/bin/env bun' : '',
      dir: 'dist/fservice',
      entryFileNames: 'index.js',
      chunkFileNames: 'index.[hash].js',
    },
    plugins: [
      fnetDelete({ targets: ["dist/fservice/**"] }),
      ...commonPlugins()
    ],
    external: id => /node_modules/.test(id)
  }
];