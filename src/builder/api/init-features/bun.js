import merge from 'lodash.merge';
import fs from 'node:fs';
import path from 'node:path';
import fnetParseImports from '@flownet/lib-parse-imports-js';

import cssFeatures from './css.js';
import copyFeatures from './copy.js';
import jsonFeatures from './json.js';
import stringFeatures from './string.js';
import imageFeatures from './image.js';

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

export default async function initFeaturesBun({ atom, context, setProgress }) {
  await setProgress({ message: "Initializing features..." });

  atom.doc.features = atom.doc.features || {};
  const features = atom.doc.features;

  // Project features
  features.project = features.project || {};
  features.project.format = features.project.format || features.project_format || "esm";
  features.project_format = features.project.format;

  features.dts_enabled = features.dts === true || (typeof features.dts !== 'undefined' && features.dts !== false);

  const projectDir = path.resolve(context.project.projectDir);

  // Check for app entry file
  const appEntry = findEntryFile({ dir: path.resolve(projectDir, './app') });
  if (appEntry.file) {
    setProgress('Parsing app entry imports...');

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

  // Check for CLI entry file
  const cliEntry = findEntryFile({ dir: path.resolve(projectDir, './cli') });
  if (cliEntry.file) {
    setProgress('Parsing cli entry imports...');

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

  // Check for src entry file (for workflow.lib)
  if (atom.type === 'workflow.lib') {
    const srcEntry = findEntryFile({ dir: path.resolve(projectDir, './src') });

    if (srcEntry.file) {
      setProgress('Parsing src entry imports...');

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

  const isAppReact = Reflect.has(features, 'app_entry_uses_jsx') ? features.app_entry_uses_jsx === true : features.src_entry_uses_jsx === true;
  const isCliReact = Reflect.has(features, 'cli_entry_uses_jsx') ? features.cli_entry_uses_jsx === true : features.src_entry_uses_jsx === true;

  features.form_enabled = (isAppReact || isCliReact) || features.form === true || features.form?.enabled === true;
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
  features.app.folder = features.app.folder || features.app.format || "esm";
  features.app.dir = `./dist/app/${features.app.folder}`;
  features.app.html = features.app.html !== false;

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
  } else features.cli = {
    enabled: true,
    extend: features.cli_has_entry === true,
    export: true,
    react: isCliReact, ...(features.cli || {})
  };

  features.cli.enabled = features.cli.enabled === true && (atom.doc.features.form_enabled === false || features.cli.extend === true || features.cli.enabled === true);
  features.cli.format = features.cli.format || "esm";
  features.cli.folder = features.cli.folder || features.cli.folder || "esm";
  features.cli.dir = `./dist/cli/${features.cli.folder}`;
  features.cli.node_options = features.cli.node?.options || features.cli.node_options || '';
  features.json = features.cli.enabled || features.json;

  // Bun build configuration
  features.bun = features.bun || {};
  features.bun.build = features.bun.build || {};

  // Default build configurations for different outputs
  const bunBuildDefault = {
    default: {
      format: "esm",
      target: "browser",
      minify: false,
      sourcemap: "external",
      entrypoints: ["./src/default/index.js"],
      outdir: "./dist/default/esm"
    },
    defaultCjs: {
      format: "cjs",
      target: "node",
      minify: false,
      sourcemap: "external",
      entrypoints: ["./src/default/index.js"],
      outdir: "./dist/default/cjs"
    }
  };

  // Add CLI build configuration if enabled
  if (features.cli.enabled) {
    features.cli.input = {
      file: `./src/cli/index.js`,
      dir: `./src/cli/`,
      ...(features.cli.input || {})
    };
    features.cli.output = {
      file: `./dist/cli/${features.cli.folder}/index.js`,
      dir: `./dist/cli/${features.cli.folder}/`,
      ...(features.cli.output || {})
    };

    bunBuildDefault.cli = {
      format: "esm",
      target: "node",
      minify: false,
      sourcemap: "external",
      entrypoints: [features.cli.input.file],
      outdir: features.cli.dir
    };
  }

  // Add App build configuration if enabled
  if (features.app.enabled) {
    features.app.input = {
      file: `./src/app/index.js`,
      dir: `./src/app/`,
      ...(features.app.input || {})
    };
    features.app.output = {
      file: `./dist/app/${features.app.folder}/index.js`,
      dir: `./dist/app/${features.app.folder}/`,
      ...(features.app.output || {})
    };
    bunBuildDefault.app = {
      format: "esm",
      target: "browser",
      minify: false,
      sourcemap: "external",
      entrypoints: [features.app.input.file],
      outdir: features.app.dir
    };
  }

  // Merge default configurations with user-defined ones
  features.bun.build = merge(bunBuildDefault, features.bun.build || {});

  // Other features
  features.preact_enabled = features.preact === true || (features.preact && features.preact?.enabled !== false);
  features.dependency_auto_enabled = features.dependency_auto !== false && features.dependency_auto?.enabled !== false;
  features.npm_install_flags = features.npm_install_flags || '';
  features.react_version = features.react_version || features.react?.version || 18;

  // Runtime features
  features.runtime = features.runtime || {};
  features.runtime.type = "bun";
  features.runtime.template = "bun";

  // Apply other feature initializers that are compatible with Bun
  cssFeatures({ atom, context, setProgress });
  copyFeatures({ atom, context, setProgress });
  jsonFeatures({ atom, context, setProgress });
  stringFeatures({ atom, context, setProgress });
  imageFeatures({ atom, context, setProgress });
}
