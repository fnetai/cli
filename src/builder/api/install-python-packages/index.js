const path = require('node:path');

const fnetAutoCondaEnv = require('@fnet/auto-conda-env');
const fnetRender = require('@flownet/lib-render-templates-dir');

module.exports = async (args) => {

  const { setProgress, atom, context } = args;

  setProgress({ message: 'Installing Python packages' });

  const projectDir = context.projectDir;

  const parserEnv = await fnetAutoCondaEnv({
    pythonVersion: "3.12",
    packages: [{ package: "fnet-import-parser", version: "0.1.9" }]
  });

  const { errors, result } = await parserEnv.runBin('fnet_import_parser', [
    "--entry_file", path.join(projectDir, 'src', 'default', 'index.py')
  ], { captureName: 'result' });

  if (errors) throw new Error(errors.format());

  const parsedImports = JSON.parse(result.items[0].stdout);
  const detectedDependencies = parsedImports.required['third-party']?.map(pkg => {
    return {
      package: pkg.metadata?.package || pkg.path,
      version: pkg.metadata?.version || undefined,
      channel: pkg.metadata?.channel || undefined
    }
  }) || [];

  // console.log(detectedDependencies);

  const userDependencies = atom.doc.dependencies || [];

  // expand userDependencies with detectedDependencies if not already present
  for (const dep of detectedDependencies) {
    if (!userDependencies.some(userDep => userDep.package === dep.package)) {
      userDependencies.push(dep);
    }
  }

  // project workspace
  const condaDir = path.join(projectDir, '.conda');

  const pythonEnv = await fnetAutoCondaEnv({
    // name: atom.doc.name,
    envDir: condaDir,
    pythonVersion: atom.doc.features.runtime.version || "3.12",
    packages: userDependencies
  });

  context.pythonEnv = pythonEnv;

  args.packageDependencies = userDependencies;

  // TODO: move to a separate plugin
  const dirs = atom.doc.features.render?.dirs || [];

  for (const dir of dirs) {
    dir.dir = path.resolve(projectDir, dir.dir);
    dir.outDir = path.resolve(projectDir, dir.outDir);
    await fnetRender(dir);
  }

  // TODO: move to a separate plugin
  let tmplCtx = { params: {} };
  tmplCtx.params.package_name = atom.doc.name;
  tmplCtx.params.version = "0.1.0";
  tmplCtx.params.bin_name = atom.doc.name;
  tmplCtx.params.python_requires = atom.doc.features.runtime.version || ">=3.12";
  tmplCtx.params.dependencies = userDependencies;
  tmplCtx.params.scripts = JSON.stringify({
    "cli": `'${path.relative(context.projectDir, pythonEnv.pythonBin)}' '${path.join('.', 'src', 'cli', 'index.py')}'`
  });

  await fnetRender({
    pattern: ["setup.py.njk", "package.json.njk", "pyproject.toml.njk"],
    dir: context.templateDir,
    outDir: context.projectDir,
    context: tmplCtx,
  });

  // await pythonEnv.runPip(["install", "-e", '.'], { wdir: context.projectDir });
}