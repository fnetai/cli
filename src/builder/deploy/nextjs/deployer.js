import fs from "node:fs";
import fnetShellJs from "@fnet/shelljs";
import fnetRenderTemplatesDir from "@flownet/lib-render-templates-dir";
import path from "node:path";
import resolveTemplatePath from '../../../utils/resolve-template-path.js';

export default async ({
  atom,
  params,
  config,
  src,
  dest,
}) => {

  params.name = params.name || "nextjs";
  params.entry = params.entry || "app/esm";
  params.id = params.id || "com.example.nextjs";
  params.version = params.version || "0.1.0";

  params.title = params.title || atom?.doc?.title || params.name || atom?.doc?.name || "NextJs App";
  params.package_name = params.package_name || params.name;
  params.author = params.author || atom?.doc?.author || "Flownet";
  params.description = params.description || atom?.doc?.description || "NextJs App built with Flownet";

  params.vendor = params.vendor || "flownet.ai";
  params.include_css = atom?.doc?.features?.css_options?.extract === true;
  params.bundle_name = atom?.doc?.bundleName;

  params.package_dir = params.package_dir || `./.package/${params.name}`;
  params.package_dir = path.resolve(dest, params.package_dir);

  // remove package dir if exists
  if (fs.existsSync(params.package_dir)) fs.rmSync(params.package_dir, { recursive: true });

  params.out_dir = params.out_dir || `./.out/${params.name}`;
  params.out_dir = path.resolve(dest, params.out_dir);

  // remove out dir if exists
  if (fs.existsSync(params.out_dir)) fs.rmSync(params.out_dir, { recursive: true });

  // template dir
  const templateDir = resolveTemplatePath('./template/deploy/to-nextjs');
  if (!fs.existsSync(templateDir)) throw new Error(`${templateDir} doesn't exist`);

  // source dir check
  if (!src || !fs.existsSync(src)) throw new Error(`${src} doesn't exists`);

  // source dist dir check
  const srcDistDir = path.resolve(src, `./dist`);
  if (!fs.existsSync(srcDistDir)) throw new Error(`${srcDistDir} doesn't exists`);

  // dest dir check
  if (!dest || !fs.existsSync(dest)) throw new Error(`${dest} doesn't exists`);

  // create out directory
  const outDir = path.resolve(dest, params.out_dir);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // create package directory
  const packageDir = path.resolve(src, params.package_dir);
  if (!fs.existsSync(packageDir)) fs.mkdirSync(packageDir, { recursive: true });

  params.dependencies = params.dependencies || [];

  if (!params.dependencies.find(w => w.package === 'next')) params.dependencies.push({ package: 'next', version: '^13.5' });
  if (!params.dependencies.find(w => w.package === 'react')) params.dependencies.push({ package: 'react', version: '^18.2' });
  if (!params.dependencies.find(w => w.package === 'react-dom')) params.dependencies.push({ package: 'react-dom', version: '^18.2' });

  await fnetRenderTemplatesDir({
    dir: templateDir,
    outDir: outDir,
    context: { atom, params, config },
    copyUnmatchedAlso: true
  });

  let shResult = await fnetShellJs(`cp -a ${srcDistDir} ${outDir}`);
  if (shResult.code !== 0) throw new Error('Couldn\'t copy project dist files.');

  shResult = await fnetShellJs(`npm install && npm run build`, { cwd: outDir });
  if (shResult.code !== 0) throw new Error('Couldn\'t build project.');
}
