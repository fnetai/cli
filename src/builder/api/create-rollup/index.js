
const fs = require("node:fs");
const path = require("node:path");
const nunjucks = require("nunjucks");
const fnetParseImports = require('@flownet/lib-parse-imports-js');

module.exports = async ({ atom, setInProgress, context, packageDependencies }) => {

    await setInProgress({ message: "Creating rollup file." });

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

    const templateDir = context.templateCommonDir;
    const template = nunjucks.compile(
        fs.readFileSync(path.resolve(templateDir, `rollup.config.js.njk`), "utf8"),
        nunjucks.configure(templateDir)
    );

    const templateRender = template.render(templateContext);

    const projectDir = context.projectDir;
    const filePath = path.resolve(projectDir, `rollup.config.js`);
    fs.writeFileSync(filePath, templateRender, 'utf8');
}