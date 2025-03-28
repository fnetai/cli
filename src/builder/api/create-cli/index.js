const fs = require("node:fs");
const path = require("node:path");
const fnetShellJs = require('@fnet/shelljs');
const fnetRender = require('@flownet/lib-render-templates-dir');

module.exports = async ({ atom, setProgress, context, packageDependencies }) => {

    if (atom.doc.features.cli.enabled !== true) return;

    await setProgress({ message: "Creating cli." });

    const templateContext = {
        atom: atom,
        packageDependencies: packageDependencies
    }

    const templateDir = context.templateDir;

    const outDir = path.resolve(context.projectDir, `src/cli`);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    await fnetRender({
        pattern: ["index.js.njk"],
        dir: path.resolve(templateDir, `src/cli`),
        outDir,
        context: templateContext,
    });
}