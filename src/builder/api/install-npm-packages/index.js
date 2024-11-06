const shell = require('shelljs');

module.exports = async ({ setProgress,atom, context }) => {

    const projectDir = context.projectDir;

    await setProgress({ message: "Installing npm packages." });
    const result = shell.exec(`npm install ${atom.doc.features.npm_install_flags}`, { cwd: projectDir });
    if (result.code !== 0) throw new Error('Couldnt install npm packages.');
}