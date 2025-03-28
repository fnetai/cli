const fnetShellJs = require('@fnet/shelljs');

module.exports = async ({ setProgress,atom, context }) => {

    const projectDir = context.projectDir;

    await setProgress({ message: "Installing npm packages." });
    const result = await fnetShellJs(`npm install ${atom.doc.features.npm_install_flags}`, { cwd: projectDir });
    if (result.code !== 0) throw new Error('Couldnt install npm packages.');
}