import fs from "node:fs";
import path from "node:path";
import nunjucks from "nunjucks";
import fnetParseImports from '@flownet/lib-parse-imports-js';

export default async function createRollup({ atom, setProgress, context, packageDependencies }) {

  await setProgress({ message: "Creating rollup file." });

  const templateContext = {
    atom,
    packageDependencies
  }

  // SCAN ENTRY FILE
  const entryFile = path.resolve(context.projectDir, "src", "default/index.js");
  if (!fs.existsSync(entryFile)) throw new Error(`Entry file not found: ${entryFile}`);

  const packages = await fnetParseImports({ file: entryFile, recursive: true });

  // ADD NODE BUILTINS
  const nodeBuiltins = packages.all.filter(p => p.type === "node").map(p => p.path);
  const rollup_output = atom.doc.features.rollup_output;
  const keys = Object.keys(rollup_output);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = rollup_output[key];
    if (value.browser === true) {
      if (nodeBuiltins.length > 0) {

        // GLOBALS
        value.globals_enabled = true;
        value.globals = value.globals || [];
        value.globals = value.globals.concat(nodeBuiltins.map(nodeBuiltin => { return { key: nodeBuiltin, value: nodeBuiltin } }));

        // ALIAS
        value.alias_enabled = true;
        value.alias = value.alias || {};
        value.alias.entries = value.alias.entries || {};
        for (let j = 0; j < nodeBuiltins.length; j++) {
          const nodeBuiltin = nodeBuiltins[j];
          value.alias.entries[nodeBuiltin] = `node:${nodeBuiltin}`;
          value.alias.entries[`node:${nodeBuiltin}`] = nodeBuiltin;
        }

        // EXTERNAL
        value.external_enabled = true;
        value.external = value.external || [];
        value.external = value.external.concat(nodeBuiltins);
      }
    }
  }

  // RENDER TEMPLATE rollup.config.js.njk
  const templateDir = context.templateDir;
  let template = nunjucks.compile(
    fs.readFileSync(path.resolve(templateDir, `rollup.config.mjs.njk`), "utf8"),
    nunjucks.configure(templateDir)
  );

  let templateRender = template.render(templateContext);

  const projectDir = context.projectDir;
  let filePath = path.resolve(projectDir, `rollup.config.mjs`);
  fs.writeFileSync(filePath, templateRender, 'utf8');
}