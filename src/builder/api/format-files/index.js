// const shell = require('shelljs');
const path = require("path");
const fnetShellFlow = require("@fnet/shell-flow");

module.exports = async ({ setProgress, context }) => {

  const projectDir = context.projectDir;

  await setProgress({ message: "Prettifiying source files." });

  let srcDir = path.join("src", "**", "*");

  await fnetShellFlow({
    commands: {
      steps: [`prettier --write ${srcDir} *.{js,cjs,mjs,json,yaml,html} --no-error-on-unmatched-pattern`],
      wdir: projectDir,
    }
  });
  
  // const result = shell.exec(`prettier --write ${srcDir} *.{js,cjs,mjs,json,yaml,html} --no-error-on-unmatched-pattern`, { cwd: projectDir });
  // if (result.code !== 0) throw new Error('Couldnt format files.');
}