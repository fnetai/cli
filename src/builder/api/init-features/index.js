const merge = require('lodash.merge');
const fs = require('node:fs');
const path = require('node:path');
const fnetParseImports = require('@flownet/lib-parse-imports-js');

function findEntryFile({ dir, name = 'index' }) {
  let entryFile = path.resolve(dir, `./${name}.tsx`);

  if (!fs.existsSync(entryFile)) entryFile = path.resolve(dir, `./${name}.ts`);
  if (!fs.existsSync(entryFile)) entryFile = path.resolve(dir, `./${name}.jsx`);
  if (!fs.existsSync(entryFile)) entryFile = path.resolve(dir, `./${name}.js`);
  if (!fs.existsSync(entryFile)) return {};

  const file = entryFile;
  const ext = path.extname(entryFile);
  const ts = ext === '.ts' || ext === '.tsx';

  return { file, ext, ts, name };
}

module.exports = async ({ atom, context }) => {

  atom.doc.features = atom.doc.features || {};
  const features = atom.doc.features;

  // project format
  features.project = features.project || {};
  features.project.format = features.project.format || features.project_format || "esm";
  features.project_format = features.project.format;

  features.dts_enabled = features.dts === true || (typeof features.dts !== 'undefined' && features.dts !== false);

  if (!features.hasOwnProperty('all_parsed_imports')) features.all_parsed_imports = true;

  const projectDir = path.resolve(context.project.projectDir);

  const appEntry = findEntryFile({ dir: path.resolve(projectDir, './app') });
  if (appEntry.file) {
    let parsed = await fnetParseImports({ file: appEntry.file, recursive: true });
    let usesJSX = parsed.all.some(w => w.usesJSX === true && w.type === 'local');
    features.app_uses_jsx = usesJSX;
    features.app_has_entry = true;
    parsed = await fnetParseImports({ file: appEntry.file });
    usesJSX = parsed.all.some(w => w.usesJSX === true && w.type === 'local');
    features.app_entry_uses_jsx = usesJSX;
    features.app_entry_is_ts = appEntry.ts;
    features.app_entry_ext = appEntry.ext;
  }

  const cliEntry = findEntryFile({ dir: path.resolve(projectDir, './cli') });
  if (cliEntry.file) {
    let parsed = await fnetParseImports({ file: cliEntry.file, recursive: true });
    let usesJSX = parsed.all.some(w => w.usesJSX === true && w.type === 'local');
    features.cli_uses_jsx = usesJSX;
    features.cli_has_entry = true;
    parsed = await fnetParseImports({ file: cliEntry.file });
    usesJSX = parsed.all.some(w => w.usesJSX === true && w.type === 'local');
    features.cli_entry_uses_jsx = usesJSX;
    features.cli_entry_is_ts = cliEntry.ts;
    features.cli_entry_ext = cliEntry.ext;
  }

  if (atom.type === 'workflow.lib') {
    const srcEntry = findEntryFile({ dir: path.resolve(projectDir, './src') });

    if (srcEntry.file) {
      let parsed = await fnetParseImports({ file: srcEntry.file, recursive: true });
      let usesJSX = parsed.all.some(w => w.usesJSX === true && w.type === 'local');
      features.src_uses_jsx = usesJSX;
      features.src_has_entry = true;
      parsed = await fnetParseImports({ file: srcEntry.file });
      usesJSX = parsed.all.some(w => w.usesJSX === true && w.type === 'local');
      features.src_entry_uses_jsx = usesJSX;
      features.src_entry_is_ts = srcEntry.ts;
      features.src_entry_ext = srcEntry.ext;
    }
  }

  const isAppReact = features.app_has_entry === true || features.src_uses_jsx === true;
  const isCliReact = features.cli_has_entry === true || features.src_uses_jsx === true;

  features.form_enabled = atom.doc.form === true || atom.doc.form?.enabled === true || features.form === true || features.form?.enabled === true;
  features.multiple_enabled = features.multiple_enabled || features.multiple === true || features.multiple?.enabled === true;

  // APP PROPS
  if (features.app === false) {
    features.app = {
      enabled: false,
    }
  } else if (features.app === true) {
    features.app = {
      enabled: true,
      extend: features.app_has_entry === true,
      export: true,
      react: isAppReact
    }
  } else features.app = { enabled: true, extend: features.app_has_entry === true, export: true, react: isAppReact, ...(features.app || {}) };


  features.app.enabled = features.app.enabled === true && (atom.doc.features.form_enabled === true || features.app.extend === true || features.app.enabled === true);
  features.app.format = features.app.format || "esm";
  features.app.folder = features.app.folder || features.app.format || "default";


  // CLI PROPS
  if (features.cli === false) {
    features.cli = {
      enabled: false
    }
  } else if (features.cli === true) {
    features.cli = {
      enabled: true,
      extend: features.cli_has_entry === true,
      export: true,
      react: isCliReact
    }
  } else features.cli = { enabled: true, extend: features.cli_has_entry === true, export: true, react: isCliReact, ...(features.cli || {}) };
  features.cli.enabled = features.cli.enabled === true && (atom.doc.features.form_enabled === false || features.cli.extend === true || features.cli.enabled === true);
  features.cli.format = features.cli.format || "esm";
  features.cli.folder = features.cli.folder || features.cli.folder || "esm";
  features.cli.node_options = features.cli.node?.options || features.cli.node_options || '';

  // rollup output default
  const rollup_output_default = {
    cjs: {
      format: "cjs",
      context: features.form_enabled ? "window" : "global",
      babel: (features.src_uses_jsx === true) || false,
      browser: false,
      replace: true,
      terser: true,
      enabled: true,
      string: true,
    },
    cjsx: {
      format: "cjs",
      context: features.form_enabled ? "window" : "global",
      babel: (features.src_uses_jsx === true) || false,
      browser: true,
      replace: true,
      enabled: false,
      terser: true,
      string: true,
    },
    esm: {
      format: "esm",
      context: features.form_enabled ? "window" : "global",
      babel: (features.src_uses_jsx === true) || false,
      browser: false,
      replace: true,
      browsersync: true,
      terser: false,
      enabled: true,
      copy: true,
      string: true,
    },
    esmx: {
      format: "esm",
      browser: true,
      babel: true,
      context: features.form_enabled ? "window" : "global",
      replace: true,
      browsersync: false,
      enabled: false,
      terser: true,
      string: true,
    },
    iife: {
      format: "iife",
      context: features.form_enabled ? "window" : "global",
      babel: true,
      browser: true,
      replace: true,
      enabled: features.iife !== false,
      terser: true,
      string: true,
    },
    umd: {
      format: "umd",
      context: features.form_enabled ? "window" : "global",
      babel: true,
      browser: true,
      replace: true,
      enabled: false,
      terser: true,
      string: true,
    }
  };

  // babel targets default
  const babel_default = {
    targets: {
      browsers: "last 9 versions, not dead",
      node: "18"
    }
  }


  // replace default
  const replace_default = {}

  // terser default
  const terser_default = {}

  // css default
  const css_default = {}

  // wasm default
  const wasm_default = {}

  // copy default
  const copy_default = {}

  // json default
  const json_default = {}

  // image default
  const image_default = {}

  // analyzer default
  const analyzer_default = {
    summaryOnly: true,
    limit: 12
  }

  // visualizer default
  const visualizer_default = {}

  // string default
  const string_default = {}

  // webos default
  if (features.webos === true) {
    rollup_output_default.webos = {
      format: "iife",
      browser: true,
      babel: true,
      context: "window",
      replace: true,
      terser: true,
      string: true,
      input: "./src/app/index.js",
      output_dir: `./dist/app/webos`,
      babel_options: {
        targets: {
          chrome: "79"
        }
      }
    }
  }

  // electron default
  if (features.electron === true) {
    rollup_output_default.electron = {
      format: "iife",
      browser: true,
      babel: true,
      context: "window",
      replace: true,
      terser: true,
      string: true,
      input: "./src/app/index.js",
      output_dir: `./dist/app/electron`,
    }
  }

  // nextsj default
  if (features.nextjs === true) {
    rollup_output_default.nextjs = {
      format: "esm",
      browser: true,
      babel: true,
      context: "window",
      replace: true,
      terser: true,
      string: true,
      input: "./src/app/index.js",
      output_dir: `./dist/app/nextjs`,
    }
  }

  // ios default
  if (features.ios === true) {
    rollup_output_default.ios = {
      format: "iife",
      browser: true,
      babel: true,
      context: "window",
      replace: true,
      terser: true,
      string: true,
      input: "./src/app/index.js",
      output_dir: `./dist/app/ios`,
    }
  }

  // ios default
  if (features.macos === true) {
    rollup_output_default.macos = {
      format: "iife",
      browser: true,
      babel: true,
      context: "window",
      replace: true,
      terser: true,
      string: true,
      input: "./src/app/index.js",
      output_dir: `./dist/app/macos`,
    }
  }

  // app default
  if (features.app.enabled === true) {
    features.app.dir = `./dist/app/${features.app.folder}`;

    rollup_output_default.app = {
      format: features.app.format,
      browser: true,
      babel: true,
      context: "window",
      replace: true,
      input: "./src/app/index.js",
      output_dir: features.app.dir,
      terser: true,
      output_exports: features.app.export === false ? "none" : "auto",
      string: true,
    }

    copy_default.targets = copy_default.targets || [];
    copy_default.targets.push({ src: "./src/app/index.html", dest: features.app.dir });
  }

  // cli default
  if (features.cli.enabled === true) {
    features.cli.dir = `./dist/cli/${features.cli.folder}`;

    rollup_output_default.cli = {
      format: features.cli.format,
      context: "global",
      babel: (features.src_uses_jsx === true || features.cli_uses_jsx === true) || false,
      browser: false,
      replace: true,
      enabled: true,
      input: "./src/cli/index.js",
      output_dir: features.cli.dir,
      banner: "#!/usr/bin/env node",
      terser: true,
      output_exports: features.cli.export === false ? "none" : "auto",
      string: true
    }
  }

  // browsersync default
  const browsersync_default = {
    server: '.',
    startPath: `${path.normalize(features.app.dir || '.')}`,
    files: [path.normalize("./dist/**/*")],
    cors: true,
    open: false,
  }

  features.babel_options = (features.babel_options || features.babel?.options || babel_default);
  features.browsersync_options = merge(browsersync_default, features.browsersync_options || features.browsersync?.options || {});
  features.replace_options = merge(replace_default, features.replace_options || features.replace?.options || {});
  features.terser_options = merge(terser_default, features.terser_options || features.terser?.options || {});
  features.css_options = merge(css_default, features.css_options || features.css?.options || {});
  features.wasm_options = merge(wasm_default, features.wasm_options || features.wasm?.options || {});
  features.copy_options = merge(copy_default, features.copy_options || features.copy?.options || {});
  features.json_options = merge(json_default, features.json_options || features.json?.options || {});
  features.image_options = merge(image_default, features.image_options || features.image?.options || {});
  features.analyzer_options = merge(analyzer_default, features.analyzer_options || features.analyzer?.options || {});
  features.visualizer_options = merge(visualizer_default, features.visualizer_options || features.visualizer?.options || {});
  features.string_options = merge(string_default, features.string_options || features.string?.options || {});

  features.rollup = features.rollup || {};
  features.rollup_output = merge(rollup_output_default, features.rollup_output || features.rollup?.output || {});

  features.string_enabled = features.string === true || (features.string && features.string?.enabled !== false);
  features.preact_enabled = features.preact === true || (features.preact && features.preact?.enabled !== false);

  const rollup_output_keys = Object.keys(rollup_output_default);
  for (const key of rollup_output_keys) {
    const output = rollup_output_default[key];

    if (!output) continue;

    if (features.rollup[key] === false) {
      output.enabled = false;
      continue;
    };

    if (features.rollup[key] === true) output.enabled = true;

    output.babel_options = output.babel_options || features.babel_options;
    output.browsersync_options = merge(features.browsersync_options, output.browsersync_options);
    output.replace_options = merge(features.replace_options, output.replace_options);
    output.terser_options = merge(features.terser_options, output.terser_options);
    output.css_options = merge(features.css_options, output.css_options);
    output.wasm_options = merge(features.wasm_options, output.wasm_options);
    output.copy_options = merge(features.copy_options, output.copy_options);
    output.json_options = merge(features.json_options, output.json_options);
    output.image_options = merge(features.image_options, output.image_options);
    output.analyzer_options = merge(features.analyzer_options, output.analyzer_options);
    output.visualizer_options = merge(features.visualizer_options, output.visualizer_options);
    output.string_options = merge(features.string_options, output.string_options);
    output.string = features.string_enabled && output.string;

    if (features.preact_enabled) {
      output.alias_enabled = true;
      output.alias = output.alias || {};
      output.alias.entries = output.alias.entries || {};
      output.alias.entries['react'] = 'preact/compat';
      output.alias.entries['react-dom'] = 'preact/compat';
    }

    if (features.form_enabled) output.babel = true;
  }

  features.babel_enabled = rollup_output_keys.some(w => features.rollup_output[w].babel === true);
  features.browser_enabled = rollup_output_keys.some(w => features.rollup_output[w].babel === true);
  features.browsersync_enabled = features.browsersync !== false && rollup_output_keys.some(w => features.rollup_output[w].browsersync === true);
  features.browsersync_enabled = features.browsersync_enabled && features.app.enabled;

  features.wasm_enabled = features.wasm === true || (features.wasm && features.wasm?.enabled !== false);
  features.css_enabled = features.css === true || (features.css && features.css?.enabled !== false);
  features.json_enabled = features.json === true || (features.json && features.json?.enabled !== false);
  // features.terser_enabled = features.terser === true || (features.terser && features.terser?.enabled !== false);
  features.terser_enabled = features.terser !== false;
  features.copy_enabled = features.app.enabled || features.copy_enabled || (features.copy && features.copy?.enabled !== false);
  features.image_enabled = features.image === true || (features.image && features.image?.enabled !== false);
  features.analyzer_enabled = features.analyzer === true || (features.analyzer && features.analyzer?.enabled !== false);
  features.visualizer_enabled = features.visualizer === true || (features.visualizer && features.visualizer?.enabled !== false);

  features.dependency_auto_enabled = features.dependency_auto !== false && features.dependency_auto?.enabled !== false;
  features.npm_install_flags = features.npm_install_flags || '';
  features.react_version = features.react_version || features.react?.version || 18;
}