const fs = require('node:fs');
const path = require('node:path');
const fnetRenderTemplateDir = require('@flownet/lib-render-templates-dir');
module.exports = async ({ atom, setInProgress, context, packageDependencies }) => {
    
    if (atom.doc.features.app.enabled!==true) return;
    
    await setInProgress({ message: "Creating index.html." });

    const templateContext = {
        atom: atom,
        packageDependencies: packageDependencies,
        ts: Date.now()
    }
    const templateDir = context.templateDir;

    const outDir = path.resolve(context.projectDir, `src/app`);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    await fnetRenderTemplateDir({
        pattern: ["index.html.njk", "index.js.njk"],
        dir: path.resolve(templateDir, `src/app`),
        outDir,
        context: templateContext,
    });
}