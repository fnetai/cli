import fnetShellJs from '@fnet/shelljs';
import which from '../../which.js';

export default async function installNpmPackages({ setProgress, atom, context }) {

  const projectDir = context.projectDir;

  await setProgress({ message: "Installing npm packages." });

  if (which('bun')) {
    const result = await fnetShellJs(`bun install ${atom.doc.features.npm_install_flags}`, { cwd: projectDir });
    if (result.code !== 0) throw new Error('Couldnt install npm packages.');
  } else {
    const result = await fnetShellJs(`npm install ${atom.doc.features.npm_install_flags}`, { cwd: projectDir });
    if (result.code !== 0) throw new Error('Couldnt install npm packages.');
  }
}