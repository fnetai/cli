const commonjs = require("@rollup/plugin-commonjs");
const resolve = require("@rollup/plugin-node-resolve").nodeResolve;
const replace = require("@rollup/plugin-replace");
const json = require("@rollup/plugin-json");
const terser = require("@rollup/plugin-terser");
const DEVELOPMENT = process.env.DEVELOPMENT ? true : false;

const commonPlugins = () => {
  const plugins = [
    json(),
    replace({
      // "#!/usr/bin/env node": "",
      "process.env.NODE_ENV": JSON.stringify(DEVELOPMENT ? "development" : "production"),
      preventAssignment: true,
    }),
    resolve({
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
      preferBuiltins: true,
    }),
    commonjs({
      // ignoreDynamicRequires: true,
    }),
  ];

  if (!DEVELOPMENT) {
    plugins.push(terser());
  }

  return plugins;
};

export default [
  // {
  //   input: `src/index.js`,
  //   output: {
  //     file: 'dist/index.js',
  //     format: "cjs",
  //     exports: "auto",
  //     banner: '#!/usr/bin/env node',
  //   },
  //   plugins: commonPlugins(),
  //   external: id => /node_modules/.test(id)
  // },
  {
    input: `src/builder/wf-cli.js`,
    output: {
      file: 'dist/builder/wf-cli.js',
      format: "cjs",
      exports: "auto",
      banner: '#!/usr/bin/env node',
    },
    plugins: commonPlugins(),
    external: id => /node_modules/.test(id)
  },
  {
    input: `src/builder/lib-cli.js`,
    output: {
      file: 'dist/builder/lib-cli.js',
      format: "cjs",
      exports: "auto",
      banner: '#!/usr/bin/env node',
    },
    plugins: commonPlugins(),
    external: id => /node_modules/.test(id)
  }
];