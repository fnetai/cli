const shell = require('shelljs');

module.exports = async ({ setInProgress, context }) => {

    const projectDir = context.projectDir;

    await setInProgress({ message: "Creating .d.ts" });
    const result = shell.exec(`tsc`, { cwd: projectDir });
    if (result.code !== 0) throw new Error('Couldnt create .d.ts files.');
}