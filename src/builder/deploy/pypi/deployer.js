import fs from "node:fs";
import fnetRenderTemplatesDir from "@flownet/lib-render-templates-dir";
import fnetAutoCondaEnv from "@fnet/auto-conda-env";
import path from "node:path";
import resolveTemplatePath from '../../../utils/resolve-template-path.js';

export default async ({
  atom,
  params,
  config,
  src,
  dest,
}) => {

  params.name = params.name || "pyip";
  params.version = params.version || "0.1.0";
  params.package_name = params.package_name || params.name;
  params.bin_name = params.bin_name || params.package_name;

  params.package_dir = params.package_dir || `./.package/${params.name}`;
  params.package_dir = path.resolve(dest, params.package_dir);
  params.dependencies = params.dependencies || [];

  // remove package dir if exists
  if (fs.existsSync(params.package_dir)) fs.rmSync(params.package_dir, { recursive: true });

  params.out_dir = params.out_dir || `./.out/${params.name}`;
  params.out_dir = path.resolve(dest, params.out_dir);

  // remove out dir if exists
  if (fs.existsSync(params.out_dir)) fs.rmSync(params.out_dir, { recursive: true });

  // template dir
  const templateDir = resolveTemplatePath('./template/deploy/to-pyip');
  if (!fs.existsSync(templateDir)) throw new Error(`${templateDir} doesn't exist`);

  // source dir check
  if (!src || !fs.existsSync(src)) throw new Error(`${src} doesn't exists`);

  // dest dir check
  if (!dest || !fs.existsSync(dest)) throw new Error(`${dest} doesn't exists`);

  // source src dir check
  const srcSrcDir = path.resolve(path.join(src, 'src', 'default'));
  if (!fs.existsSync(srcSrcDir)) throw new Error(`${srcSrcDir} doesn't exists`);

  // create out directory
  const outDir = path.resolve(dest, params.out_dir);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // create package directory
  const packageDir = path.resolve(src, params.package_dir);
  if (!fs.existsSync(packageDir)) fs.mkdirSync(packageDir, { recursive: true });

  const context = { atom, params, config };

  await fnetRenderTemplatesDir({ dir: templateDir, outDir: outDir, context, unmatched: true });

  let destPackageDir = path.resolve(outDir, "package");
  if (!fs.existsSync(destPackageDir)) fs.mkdirSync(destPackageDir, { recursive: true });

  await fnetRenderTemplatesDir({ dir: srcSrcDir, outDir: path.join(destPackageDir, 'lib'), context, unmatched: true, ignore: ['__pycache__/**', '__init__.py'], follow: true });

  // rename destPackageDir
  fs.renameSync(destPackageDir, path.resolve(outDir, params.package_name));
  destPackageDir = path.resolve(outDir, params.package_name);

  const buildEnv = await fnetAutoCondaEnv({ pythonVersion: "3.12", packages: [{ package: "twine" }] });

  let envResult;

  envResult = await buildEnv.runBin('pip', ["install", "-e", "."], { wdir: outDir });
  if (envResult?.errors) throw new Error(envResult.errors.format());

  envResult = await buildEnv.runBin('pip', ["show", "-f", params.package_name]);
  if (envResult?.errors) throw new Error(envResult.errors.format());

  envResult = await buildEnv.runBin('pip', ["list"]);
  if (envResult?.errors) throw new Error(envResult.errors.format());

  envResult = await buildEnv.runBin(params.bin_name, ["--help"]);
  if (envResult?.errors) throw new Error(envResult.errors.format());

  envResult = await buildEnv.runCode(`from ${params.package_name}.lib import default; print(default);`);
  if (envResult?.errors) throw new Error(envResult.errors.format());

  envResult = await buildEnv.runCode(`from ${params.package_name} import default; print(default);`);
  if (envResult?.errors) throw new Error(envResult.errors.format());

  envResult = await buildEnv.runCode(`from ${params.package_name} import main; print(main);`);
  if (envResult?.errors) throw new Error(envResult.errors.format());

  envResult = await buildEnv.runBin('pip', ["uninstall", params.package_name, '-y']);
  if (envResult?.errors) throw new Error(envResult.errors.format());

  envResult = await buildEnv.runFile(path.join(outDir, "setup.py"), ["sdist", "bdist_wheel"], { wdir: outDir });
  if (envResult?.errors) throw new Error(envResult.errors.format());

  envResult = await buildEnv.runBin('twine', ["upload", "dist/*"], { wdir: outDir });
  if (envResult?.errors) throw new Error(envResult.errors.format());
}
