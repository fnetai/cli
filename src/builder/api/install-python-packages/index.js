const fnetAutoCondaEnv = require('@fnet/auto-conda-env');
const path = require('path');
const fnetRender = require('@flownet/lib-render-templates-dir');

module.exports = async ({ setProgress, atom, context }) => {

  setProgress({ message: 'Installing Python packages' });

  const projectDir = context.projectDir;

  const dirs = atom.doc.features.render?.dirs || [];

  for (const dir of dirs) {
    dir.dir = path.resolve(projectDir, dir.dir);
    dir.outDir = path.resolve(projectDir, dir.outDir);
    console.log(dir);
    await fnetRender(dir);
  }

  // project workspace
  const condaDir = path.join(projectDir, '.conda');

  const pythonEnv = await fnetAutoCondaEnv({
    envDir: condaDir,
    pythonVersion: atom.doc.features.runtime.version || "3.12",
    packages: atom.doc.dependencies
  });

  context.pythonEnv = pythonEnv;
}