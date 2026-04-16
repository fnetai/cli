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

  const { nanoid } = await import('nanoid');

  params.name = params.name || "docker";
  params.id = params.id || "com.example.docker";
  params.version = params.version || "0.1.0";
  params.image_base = params.image_base || "node:22-alpine";
  params.image_name = params.image_name || params.name;
  params.template = params.template || "docker";

  params.title = params.title || atom?.doc?.title || params.name || atom?.doc?.name || "Docker Image";
  params.package_name = params.package_name || params.name;
  params.author = params.author || atom?.doc?.author || "Flownet";
  params.description = params.description || atom?.doc?.description || "Docker Image built with Flownet";

  params.vendor = params.vendor || "flownet.ai";

  params.package_dir = params.package_dir || `./.package/${params.name}`;
  params.package_dir = path.resolve(dest, params.package_dir);

  // remove package dir if exists
  if (fs.existsSync(params.package_dir)) fs.rmSync(params.package_dir, { recursive: true });

  params.out_dir = params.out_dir || `./.out/${params.name}`;
  params.out_dir = path.resolve(dest, params.out_dir);

  // template dir
  const templateDir = resolveTemplatePath(`./template/deploy/to-docker/${params.template}`);
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

  // Process files from config.files and params.files
  const processFiles = async (files, outDir) => {
    if (files && Array.isArray(files)) {
      const filesDir = path.resolve(outDir, 'files');
      if (!fs.existsSync(filesDir)) fs.mkdirSync(filesDir, { recursive: true });

      for (let file of files) {
        if (!file.path) {
          throw new Error('Each file must have a "path" property.');
        }

        const uniqueFileName = `${nanoid()}-${path.basename(file.path)}`;
        const filePathInRenderDir = path.resolve(filesDir, uniqueFileName);

        if (file.srcfile) {
          const srcFilePath = path.resolve(src, file.srcfile);
          if (!fs.existsSync(srcFilePath)) {
            throw new Error(`Source file ${srcFilePath} does not exist.`);
          }
          fs.copyFileSync(srcFilePath, filePathInRenderDir);
          delete file.content;
          delete file.base64;
        } else if (file.content) {
          fs.writeFileSync(filePathInRenderDir, file.content, 'utf8');
        } else if (file.base64) {
          const fileContent = Buffer.from(file.base64, 'base64');
          fs.writeFileSync(filePathInRenderDir, fileContent);
        } else {
          throw new Error('Each file must have either "srcfile", "content", or "base64" property.');
        }

        file.srcfile = path.relative(outDir, filePathInRenderDir);
      }
    }
  };

  // Handle config.files
  await processFiles(config?.files, outDir);

  // Handle params.files
  await processFiles(params?.files, outDir);

  // Render templates with updated config
  await fnetRenderTemplatesDir({
    dir: templateDir,
    outDir: outDir,
    context: { atom, params, config },
    copyUnmatchedAlso: true,
    overwriteExisting: true,
  });

  // Render extra templates
  if (params.additional_template_dir) {
    const additionalTemplateDir = path.resolve(params.additional_template_dir);
    if (!fs.existsSync(additionalTemplateDir)) throw new Error(`${additionalTemplateDir} doesn't exist`);

    await fnetRenderTemplatesDir({
      dir: additionalTemplateDir,
      outDir: outDir,
      context: { atom, params, config },
      copyUnmatchedAlso: true,
      overwriteExisting: true,
    });
  }

  // copy project dist files to render dist directory
  let shResult = await fnetShellJs(`cp -a ${srcDistDir} ${outDir}`);
  if (shResult.code !== 0) throw new Error(`Couldn\'t copy project dist files: ${shResult.stderr}`);

  // copy project package.json and package-lock.json to render directory
  shResult = await fnetShellJs(`cp -a ${path.resolve(src, 'package.json')} ${outDir}`);
  if (shResult.code !== 0) throw new Error(`Couldn't copy project package.json : ${shResult.stderr}`);

  if (fs.existsSync(path.resolve(src, 'package-lock.json'))) {
    shResult = await fnetShellJs(`cp -a ${path.resolve(src, 'package-lock.json')} ${outDir}`);
    if (shResult.code !== 0) throw new Error(`Couldn't copy project package-lock.json: ${shResult.stderr}`);
  }

  if (fs.existsSync(path.resolve(src, 'bun.lock'))) {
    shResult = await fnetShellJs(`cp -a ${path.resolve(src, 'bun.lock')} ${outDir}`);
    if (shResult.code !== 0) throw new Error(`Couldn't copy project bun.lock: ${shResult.stderr}`);
  }

  // docker build and hub push
  shResult = await fnetShellJs(`bash build.sh`, { cwd: outDir });
  if (shResult.code !== 0) throw new Error(`Couldn't build project: ${shResult.stderr}`);
}
