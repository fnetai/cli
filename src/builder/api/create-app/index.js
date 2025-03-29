import fs from 'node:fs';
import path from 'node:path';
import fnetRender from '@flownet/lib-render-templates-dir';
export default async function createApp({ atom, setProgress, context, packageDependencies }) {

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