const nunjucks = require("nunjucks");
const fs = require('node:fs');
const path = require('node:path');
const fnetParseImports = require('@flownet/lib-parse-imports-js');
const fnetListNpmVersions = require('@flownet/lib-list-npm-versions');

module.exports = async ({ atom, context, packageDependencies, packageDevDependencies, setInProgress }) => {
  await setInProgress({ message: "Creating package.json." });

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
    checkFiles.push(path.resolve(context.projectDir, `src/app/index.js`));
  }

  if (atom.doc.features.cli.enabled === true) {
    checkFiles.push(path.resolve(context.projectDir, `src/cli/index.js`));
  }

  for await (const checkFile of checkFiles) {
    const srcFilePath = checkFile;
    if (!fs.existsSync(srcFilePath)) throw new Error(`App file not found: ${srcFilePath}`);

    const parsedImports = await fnetParseImports({ file: srcFilePath, recursive: true });
    const targetImports = atom.doc.features.all_parsed_imports === true ? parsedImports.all : parsedImports.required;
    for await (const parsedImport of targetImports) {
      if (parsedImport.type !== 'npm') continue;

      if (packageDependencies.find(w => w.package === parsedImport.package)) continue;
      if (packageDevDependencies.find(w => w.package === parsedImport.package)) continue;

      const npmVersions = await fnetListNpmVersions({ name: parsedImport.package, groupBy: { minor: true } });
      const npmVersion = npmVersions[0][0];

      packageDevDependencies.push({
        package: parsedImport.package,
        subpath: parsedImport.subpath,
        version: `^${npmVersion}`,
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
}