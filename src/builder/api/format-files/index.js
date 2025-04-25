import path from "node:path";
import fnetShellJs from "@fnet/shelljs";
import which from "../../which.js";

export default async function formatFiles({ setProgress, context }) {

  const projectDir = context.projectDir;

  await setProgress({ message: "Prettifiying source files." });

  let srcDir = path.join("src", "**", "*");

  if (which('bun')) {
    const result = await fnetShellJs(`prettier --write ${srcDir} *.{js,cjs,mjs,json,yaml,html} --no-error-on-unmatched-pattern`, { cwd: projectDir });
    if (result.code !== 0) throw new Error(result.stderr);
  }
  else {
    const result = await fnetShellJs(`prettier --write ${srcDir} *.{js,cjs,mjs,json,yaml,html} --no-error-on-unmatched-pattern`, { cwd: projectDir });
    if (result.code !== 0) throw new Error(result.stderr);
  }
}