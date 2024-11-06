const shell = require('shelljs');

module.exports = async ({ setProgress, context }) => {

    const projectDir = context.projectDir;

    await setProgress({ message: "Building main project." });
    const result = shell.exec(`npm run build`, { cwd: projectDir });
    if (result.code !== 0) throw new Error('Couldnt build project.');
}