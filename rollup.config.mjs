// rollup.config.mjs (or rollup.config.js if "type": "module" in package.json)

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
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
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
    input: `src/builder/wf-cli.mjs`,
    output: {
      // file: 'dist/builder/wf-cli.js',
      format: "esm", // Output format remains CJS as per original config
      exports: "auto",
      banner: (chunk) => chunk.isEntry ? '#!/usr/bin/env node' : '',
      dir: 'dist/fnet',
      entryFileNames: 'index.mjs', // Output file name pattern
      chunkFileNames: 'index.[hash].mjs', // Output file name pattern for chunks

    },
    plugins: [fnetDelete({ target: "dist/fnet" }), ...commonPlugins()],
    // External function remains the same
    external: id => /node_modules/.test(id)
  },
  {
    input: `src/builder/lib-cli.mjs`,
    output: {
      // file: 'dist/builder/lib-cli.js',
      format: "esm", // Output format remains CJS as per original config
      exports: "auto",
      banner: (chunk) => chunk.isEntry ? '#!/usr/bin/env node' : '',
      dir: 'dist/fnode',
      entryFileNames: 'index.mjs', // Output file name pattern
      chunkFileNames: 'index.[hash].mjs', // Output file name pattern for chunks
    },
    plugins: [fnetDelete({ target: "dist/fnode" }), ...commonPlugins()],
    // External function remains the same
    external: id => /node_modules/.test(id)
  }
];