import path from "node:path";
import fnetShellFlow from "@fnet/shell-flow";

export default async function formatFiles({ setProgress, context }) {

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