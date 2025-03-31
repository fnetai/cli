import nunjucks from "nunjucks";
import fs from 'node:fs';
import path from 'node:path';
import fnetParseImports from '@flownet/lib-parse-imports-js';
import pickNpmVersions from '../common/pick-npm-versions.js';

export default async function createPackageJson({ atom, context, packageDependencies, packageDevDependencies, setProgress }) {

  await setProgress({ message: "Creating package.json." });

  // move dev dependencies in packageDependencies to packageDevDependencies
  const devPackages = packageDependencies.filter(w => w.dev === true);
  devPackages.forEach(w => {
    if (!packageDevDependencies.find(x => x.package === w.package)) {
      packageDevDependencies.push(w);
    }

    const index = packageDependencies.findIndex(x => x.package === w.package);
    packageDependencies.splice(index, 1);
  });

  // TODO: PEER DEPENDENCIES
  // REACT CHECK
  const reactDep = packageDependencies.find(w => w.package === "react");
  const reactDomDep = packageDependencies.find(w => w.package === "react-dom");

  if (reactDep && !reactDomDep)
    packageDependencies.push({ package: "react-dom", version: reactDep.version });
  else if (reactDep && reactDomDep)
    reactDomDep.version = reactDep.version;

  // EMOTION CHECK
  if (reactDep && atom.doc.features.react_version >= 17) {
    if (!packageDependencies.find(w => w.package === '@emotion/react'))
      packageDependencies.push({ package: "@emotion/react", version: "^11" });
    if (!packageDependencies.find(w => w.package === '@emotion/styled'))
      packageDependencies.push({ package: "@emotion/styled", version: "^11" });
  }

  const checkFiles = [];

  if (atom.doc.features.app.enabled === true) {
    checkFiles.push({
      file: path.resolve(context.projectDir, `src/app/index.js`),
      dev: atom.doc.features.app.dev !== false
    });
  }

  if (atom.doc.features.cli.enabled === true) {
    checkFiles.push({
      file: path.resolve(context.projectDir, `src/cli/index.js`),
      dev: atom.doc.features.cli.dev !== false
    });
  }

  for await (const checkFile of checkFiles) {
    const srcFilePath = checkFile.file;
    if (!fs.existsSync(srcFilePath)) throw new Error(`App file not found: ${srcFilePath}`);

    const parsedImports = await fnetParseImports({ file: srcFilePath, recursive: true });
    const targetImports = parsedImports.all;
    
    for await (const parsedImport of targetImports) {
      if (parsedImport.type !== 'npm') continue;

      if (packageDependencies.find(w => w.package === parsedImport.package)) continue;
      if (packageDevDependencies.find(w => w.package === parsedImport.package)) continue;

      const npmVersions = await pickNpmVersions({
        name: parsedImport.package,
        projectDir: context.projectDir,
        setProgress
      });

      const targetDependencies = checkFile.dev === true ? packageDevDependencies : packageDependencies;
      targetDependencies.push({
        package: parsedImport.package,
        subpath: parsedImport.subpath,
        version: npmVersions.minorRange,
        type: "npm"
      })
    }
  }

  const templateContext = {
    atom: atom,
    packageDependencies: packageDependencies,
    packageDevDependencies: packageDevDependencies
  }

  const templateDir = context.templateCommonDir;
  const template = nunjucks.compile(
    fs.readFileSync(path.resolve(templateDir, `package.json.njk`), "utf8"),
    nunjucks.configure(templateDir)
  );

  const templateRender = template.render(templateContext);

  const projectDir = context.projectDir;
  const filePath = path.resolve(projectDir, `package.json`);
  fs.writeFileSync(filePath, templateRender, 'utf8');

  // copy fnet files to projectDir
  const fnetSrcDir = path.resolve(context.project.projectDir, 'fnet');
  if (fs.existsSync(fnetSrcDir)) {
    const fnetDestDir = path.resolve(context.projectDir, 'fnet');
    if (!fs.existsSync(fnetDestDir)) {
      fs.mkdirSync(fnetDestDir);
    }

    const fnetFiles = fs.readdirSync(fnetSrcDir);
    for (const fnetFile of fnetFiles) {
      const fnetFilePath = path.resolve(fnetSrcDir, fnetFile);
      if (!fs.lstatSync(fnetFilePath).isFile()) continue;
      const targetFilePath = path.resolve(fnetDestDir, fnetFile);
      fs.copyFileSync(fnetFilePath, targetFilePath);
    }
  }
}