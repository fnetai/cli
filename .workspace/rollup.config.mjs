import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve as resolve } from "@rollup/plugin-node-resolve";
import external from "rollup-plugin-peer-deps-external";

import fs from "fs-extra";
import path from "path";

const DEVELOPMENT = process.env.DEVELOPMENT ? true : false;
const extensions = [".ts", ".tsx", ".js", ".jsx", ".json"];

const copyFiles = async (src, dest) => {
  try {
    await fs.copy(src, dest);
    console.log(`Copied files from ${src} to ${dest}`);
  } catch (err) {
    console.error("Error copying files:", err);
  }
};

const watchFiles = async (targets) => {
  const chokidar = await import("chokidar");
  targets.forEach((target) => {
    const watcher = chokidar.watch(target.src, { persistent: true });

    watcher.on("add", async (filePath) => {
      const destPath = target.dest;
      const relativePath = path.relative(path.dirname(target.src), filePath);
      await copyFiles(filePath, path.join(destPath, relativePath));
    });

    watcher.on("change", async (filePath) => {
      const destPath = target.dest;
      const relativePath = path.relative(path.dirname(target.src), filePath);
      await copyFiles(filePath, path.join(destPath, relativePath));
    });

    watcher.on("unlink", async (filePath) => {
      const destPath = target.dest;
      const relativePath = path.relative(path.dirname(target.src), filePath);
      try {
        await fs.remove(path.join(destPath, relativePath));
        console.log(`Removed files from ${path.join(destPath, relativePath)}`);
      } catch (err) {
        console.error("Error removing files:", err);
      }
    });
  });
};

const initPlugins = async (options) => {
  const plugins = [];

  if (options.delete) {
    const { default: del } = await import("@fnet/rollup-plugin-delete");
    plugins.push(del(options.delete));
  }

  if (options.replace) {
    const { default: replace } = await import("@rollup/plugin-replace");
    plugins.push(
      replace({
        "process.env.NODE_ENV": JSON.stringify(
          DEVELOPMENT ? "development" : "production",
        ),
        preventAssignment: true,
        ...options.replace,
      }),
    );
  }

  if (options.alias) {
    const { default: alias } = await import("@rollup/plugin-alias");
    plugins.push(alias(options.alias));
  }

  if (options.copy) {
    const { default: copy } = await import("rollup-plugin-copy");
    plugins.push(copy(options.copy.options));

    if (DEVELOPMENT) watchFiles(options.copy.options.targets);
  }

  if (options.json) {
    const { default: json } = await import("@rollup/plugin-json");
    plugins.push(json(options.json.options));
  }

  plugins.push(
    external({
      includeDependencies: !options.browser,
    }),
  );

  plugins.push(
    resolve({
      extensions: extensions,
      browser: options?.browser === true,
      preferBuiltins: true,
      modulePaths: ["./node_modules"],
    }),
  );

  plugins.push(
    commonjs({
      include: /node_modules/,
    }),
  );

  if (options?.babel) {
    const { babel } = await import("@rollup/plugin-babel");
    plugins.push(
      babel({
        babelHelpers: "bundled",
        presets: [
          [
            "@babel/preset-env",
            {
              targets: options.babel.targets || "defaults",
            },
          ],
          ["@babel/preset-react"],
        ],
        extensions: extensions,
        exclude: "node_modules/**",
        plugins: options.babel.plugins || [],
        sourceMaps: DEVELOPMENT,
      }),
    );
  }

  if (options.browsersync && DEVELOPMENT) {
    const { default: browsersync } = await import(
      "@fnet/rollup-plugin-browsersync"
    );
    options.browsersync.middleware = function (req, res, next) {
      if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.setHeader(
          "Access-Control-Allow-Headers",
          "X-Requested-With,content-type",
        );
        res.setHeader("Access-Control-Allow-Credentials", true);
        res.end();
      } else {
        next();
      }
    };
    plugins.push(browsersync(options.browsersync));
  }

  return plugins;
};

const groups = [{ name: "default" }];

const configs = [];

const createConfigs = async () => {
  for (const group of groups) {
    let groupDir = path.normalize(`./dist/${group.name}/`);
    if (!fs.existsSync(groupDir)) {
      fs.mkdirSync(groupDir, { recursive: true });
    }

    {
      // CJS
      const config = {
        input: path.normalize(`src/${group.name}/index.js`),
        output: {
          dir: path.normalize(`dist/${group.name}/cjs`),
          format: "cjs",
          exports: "auto",

          entryFileNames: "[name].cjs",
          chunkFileNames: "[name]-[hash].cjs",
        },

        context: "global",

        onwarn(warning, warn) {
          switch (warning.code) {
            case "MODULE_LEVEL_DIRECTIVE":
            case "CIRCULAR_DEPENDENCY":
              return;
            default:
              warn(warning);
          }
        },
        plugins: await initPlugins({
          delete: {
            targets: [path.normalize(groupDir + "cjs")],
            runOnce: DEVELOPMENT,
          },

          format: "cjs",

          replace: {},

          json: { enabled: true, options: {} },
        }),
      };
      configs.push(config);
    }

    {
      // ESM
      const config = {
        input: path.normalize(`src/${group.name}/index.js`),
        output: {
          dir: path.normalize(`dist/${group.name}/esm`),
          format: "esm",
          exports: "auto",
        },

        context: "global",

        onwarn(warning, warn) {
          switch (warning.code) {
            case "MODULE_LEVEL_DIRECTIVE":
            case "CIRCULAR_DEPENDENCY":
              return;
            default:
              warn(warning);
          }
        },
        plugins: await initPlugins({
          delete: {
            targets: [path.normalize(groupDir + "esm")],
            runOnce: DEVELOPMENT,
          },

          format: "esm",

          replace: {},

          copy: {
            enabled: true,
            options: {
              targets: [
                { src: "./src/app/index.html", dest: "./dist/app/esm" },
              ],
            },
          },

          json: { enabled: true, options: {} },
        }),
      };
      configs.push(config);
    }

    {
      // APP
      const config = {
        input: path.normalize(`./src/app/index.js`),
        output: {
          dir: path.normalize(`./dist/app/esm`),
          format: "esm",
          exports: "auto",
        },

        context: "window",

        onwarn(warning, warn) {
          switch (warning.code) {
            case "MODULE_LEVEL_DIRECTIVE":
            case "CIRCULAR_DEPENDENCY":
              return;
            default:
              warn(warning);
          }
        },
        plugins: await initPlugins({
          delete: {
            targets: [path.normalize(groupDir + "app")],
            runOnce: DEVELOPMENT,
          },

          format: "esm",

          babel: {
            targets: { browsers: "last 9 versions, not dead", node: "18" },
          },

          replace: {},

          browser: true,

          browsersync: {
            server: ".",
            startPath: "dist/app/esm",
            files: ["dist/**/*"],
            cors: true,
            open: false,
          },

          copy: {
            enabled: true,
            options: {
              targets: [
                { src: "./src/app/index.html", dest: "./dist/app/esm" },
              ],
            },
          },

          json: { enabled: true, options: {} },
        }),
      };
      configs.push(config);
    }

    {
      // CLI
      const config = {
        input: path.normalize(`./src/cli/index.js`),
        output: {
          dir: path.normalize(`./dist/cli/esm`),
          format: "esm",
          exports: "auto",

          banner: "#!/usr/bin/env node",
        },

        context: "global",

        onwarn(warning, warn) {
          switch (warning.code) {
            case "MODULE_LEVEL_DIRECTIVE":
            case "CIRCULAR_DEPENDENCY":
              return;
            default:
              warn(warning);
          }
        },
        plugins: await initPlugins({
          delete: {
            targets: [path.normalize(groupDir + "cli")],
            runOnce: DEVELOPMENT,
          },

          format: "esm",

          replace: {},

          copy: {
            enabled: true,
            options: {
              targets: [
                { src: "./src/app/index.html", dest: "./dist/app/esm" },
              ],
            },
          },

          json: { enabled: true, options: {} },
        }),
      };
      configs.push(config);
    }
  }
};

export default async () => {
  await createConfigs();
  return configs;
};
