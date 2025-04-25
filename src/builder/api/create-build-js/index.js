import fs from "node:fs";
import path from "node:path";
import nunjucks from "nunjucks";

export default async function createBuildJs({ atom, setProgress, context, packageDependencies }) {
  await setProgress({ message: "Creating build.js file." });

  const templateContext = {
    atom,
    packageDependencies
  }

  const templateDir = context.templateDir;
  const template = nunjucks.compile(
    fs.readFileSync(path.resolve(templateDir, `build.js.njk`), "utf8"),
    nunjucks.configure(templateDir)
  );

  const templateRender = template.render(templateContext);

  const projectDir = context.projectDir;
  const filePath = path.resolve(projectDir, `build.js`);
  fs.writeFileSync(filePath, templateRender, 'utf8');
  
  // Make the file executable
  fs.chmodSync(filePath, '755');
}
