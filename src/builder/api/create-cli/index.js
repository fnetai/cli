const fs = require("node:fs");
const path = require("node:path");
const shell = require('shelljs');
const fnetRenderTemplateDir = require('@flownet/lib-render-templates-dir');

module.exports = async ({ atom, setInProgress, context, packageDependencies }) => {

    if (atom.doc.features.cli.enabled !== true) return;

    await setInProgress({ message: "Creating cli." });

    const templateContext = {
        atom: atom,
        packageDependencies: packageDependencies
    }

    const templateDir = context.templateDir;

    const outDir = path.resolve(context.projectDir, `src/cli`);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    await fnetRenderTemplateDir({
        pattern: ["index.js.njk"],
        dir: path.resolve(templateDir, `src/cli`),
        outDir,
        context: templateContext,
    });
}