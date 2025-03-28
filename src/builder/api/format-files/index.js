// const fnetShellJs = require('@fnet/shelljs');
const path = require("path");
const fnetShellFlow = require("@fnet/shell-flow");

module.exports = async ({ setProgress, context }) => {

  const projectDir = context.projectDir;

  await setProgress({ message: "Prettifiying source files." });

  let srcDir = path.join("src","**", "*");

  await fnetShellFlow({
    commands: {
      steps: [`prettier --write ${srcDir} *.{js,cjs,mjs,json,yaml,html} --no-error-on-unmatched-pattern`],
      wdir: projectDir,
    }
  });
}