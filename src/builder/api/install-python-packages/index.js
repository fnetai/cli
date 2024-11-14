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

  // await parserEnv.runBin('pip', ["show", "-f", "fnet-import-parser"]);

  const { result } = await parserEnv.runBin('fnet_import_parser', [
    "--entry_file", path.join(projectDir, 'src', 'index.py')
  ], { captureName: 'result' });

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
}