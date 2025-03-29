import fs from "node:fs";
import path from "node:path";
import fnetRender from '@flownet/lib-render-templates-dir';

export default async function createCli({ atom, setProgress, context, packageDependencies }) {

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