import fs from "node:fs";
import fnetShellJs from "@fnet/shelljs";
import fnetRenderTemplatesDir from "@flownet/lib-render-templates-dir";
import fnetCreateIosIcons from "@flownet/lib-create-ios-icons";
import path from "node:path";
import resolveTemplatePath from '../../../utils/resolve-template-path.js';

export default async ({
  atom,
  params,
  config,
  src,
  dest
}) => {

  params.name = params.name || "webos";
  params.entry = params.entry || "app/webos";
  params.id = params.id || "com.example.webos";
  params.title = params.title || atom?.doc?.title || params.name || atom?.doc?.name || "WebOS App";
  params.version = params.version || "0.1.0";

  params.vendor = params.vendor || "flownet.ai";
  params.include_css = atom?.doc?.features?.css_options?.extract === true;
  params.bundle_name = atom?.doc?.bundleName;

  params.package_name = params.package_name || params.name;
  params.author = params.author || atom?.doc?.author || "Flownet";
  params.description = params.description || atom?.doc?.description || "WebOS App built with Flownet";

  params.package_dir = params.package_dir || `./.package/${params.name}`;
  params.package_dir = path.resolve(dest, params.package_dir);
  // remove package dir if exists
  if (fs.existsSync(params.package_dir)) fs.rmSync(params.package_dir, { recursive: true });

  params.out_dir = params.out_dir || `./.out/${params.name}`;
  params.out_dir = path.resolve(dest, params.out_dir);
  // remove out dir if exists
  if (fs.existsSync(params.out_dir)) fs.rmSync(params.out_dir, { recursive: true });

  // template dir
  const templateDir = resolveTemplatePath('./template/deploy/to-webos');
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

  // render templates to out dir
  await fnetRenderTemplatesDir({
    dir: templateDir,
    outDir,
    context: { atom, params, config },
    copyUnmatchedAlso: true
  });

  // copy source dist files to out dir
  let shResult = await fnetShellJs(`cp -a ${srcDistDir} ${outDir}`);
  if (shResult.code !== 0) throw new Error('Couldnt copy dist files.');

  // create package dir
  const packageDir = path.resolve(dest, params.package_dir);
  if (!fs.existsSync(packageDir)) fs.mkdirSync(packageDir, { recursive: true });

  // create ios icons
  const iconDir = path.resolve(outDir, './');
  await fnetCreateIosIcons({ text: params.id, dir: iconDir, sizes: [80, 130] });

  // package webos
  const envFilter = { ...process.env };
  delete envFilter.NODE_OPTIONS;

  shResult = await fnetShellJs(`ares-package '${outDir}' --outdir='${packageDir}' --no-minify`, {
    cwd: dest,
    env: envFilter
  });

  if (shResult.code !== 0) throw new Error(shResult.stderr);
  else console.log(shResult.stdout);
}
