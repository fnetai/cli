const shell = require('shelljs');

module.exports = async ({atom, setInProgress, context }) => {

    if(!atom.doc.features.dts_enabled) return;
    
    const projectDir = context.projectDir;

    await setInProgress({ message: "Creating .d.ts" });
    const result = shell.exec(`tsc`, { cwd: projectDir });
    if (result.code !== 0) throw new Error('Couldnt create .d.ts files.');
}