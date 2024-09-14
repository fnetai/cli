const shell = require('shelljs');
const path=require("path");

module.exports = async ({ setInProgress, context }) => {

    const projectDir = context.projectDir;

    await setInProgress({ message: "Prettifiying source files." });

    let srcDir=path.join("src","**","*");

    const result = shell.exec(`prettier --write ${srcDir} *.{js,cjs,mjs,json,yaml,html} --no-error-on-unmatched-pattern`, { cwd: projectDir });
    if (result.code !== 0) throw new Error('Couldnt format files.');
}