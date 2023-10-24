const shell = require('shelljs');

module.exports = async ({ setInProgress, context }) => {

    const projectDir = context.projectDir;

    await setInProgress({ message: "Building main project." });
    const result = shell.exec(`npm run build`, { cwd: projectDir });
    if (result.code !== 0) throw new Error('Couldnt build project.');
}