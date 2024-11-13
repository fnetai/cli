const fnetAutoCondaEnv = require('@fnet/auto-conda-env');
const path = require('path');

module.exports = async ({ setProgress, atom, context }) => {
  const projectDir = context.projectDir;

  const condaDir = path.join(projectDir, '.conda');

  const pythonEnv = await fnetAutoCondaEnv({
    envDir: condaDir,
    pythonVersion: atom.doc.features.runtime.version || "3.12",
    packages: atom.doc.dependencies
  });

  context.pythonEnv = pythonEnv;
}