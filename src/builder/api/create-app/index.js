const fs = require('node:fs');
const path = require('node:path');
const fnetRender = require('@flownet/lib-render-templates-dir');
module.exports = async ({ atom, setProgress, context, packageDependencies }) => {

  if (atom.doc.features.app.enabled !== true) return;

  await setProgress({ message: "Creating app folder" });

  const templateContext = {
    atom: atom,
    packageDependencies: packageDependencies,
    ts: Date.now()
  }
  const templateDir = context.templateDir;

  const outDir = path.resolve(context.projectDir, `src/app`);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  let pattern = ["index.js.njk"];
  if (atom.doc.features.app.html !== false) pattern.push("index.html.njk");
  await fnetRender({
    pattern: pattern,
    dir: path.resolve(templateDir, `src/app`),
    outDir,
    context: templateContext,
  });
}