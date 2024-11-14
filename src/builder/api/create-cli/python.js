const fs = require("node:fs");
const path = require("node:path");
const shell = require('shelljs');
const fnetRender = require('@flownet/lib-render-templates-dir');

module.exports = async ({ atom, setProgress, context, packageDependencies }) => {

  if (atom.doc.features.cli.enabled !== true) return;

  await setProgress({ message: "Creating cli." });

  const templateContext = {
    atom: atom,
    packageDependencies: packageDependencies
  }

  const templateDir = context.templateDir;

  const outDir = path.join(context.projectDir, 'src', 'cli');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  await fnetRender({
    pattern: ["index.py.njk", "__init__.py.njk"],
    dir: path.join(templateDir, 'src', 'cli'),
    outDir,
    context: templateContext,
  });
}