const shell = require('shelljs');

module.exports = async ({ setInProgress, context }) => {

    const projectDir = context.projectDir;

    await setInProgress({ message: "Prettifiying source files." });
    const result = shell.exec(`prettier --write src/**/* bin/* *.{js,json,yaml,html} --no-error-on-unmatched-pattern`, { cwd: projectDir });
    if (result.code !== 0) throw new Error('Couldnt format files.');
}