const fnetShellJs = require('@fnet/shelljs');
const which = require('../../which')

module.exports = async ({ setProgress, atom, context }) => {

  const projectDir = context.projectDir;

  await setProgress({ message: "Installing npm packages." });
  const packageManager = which('bun') ? 'bun' : 'npm';
  const result = await fnetShellJs(`${packageManager} install ${atom.doc.features.npm_install_flags}`, { cwd: projectDir });
  if (result.code !== 0) throw new Error('Couldnt install npm packages.');
}