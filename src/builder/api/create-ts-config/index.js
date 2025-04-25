import fs from "node:fs";
import path from "node:path";
import nunjucks from "nunjucks";

export default async function createTsConfig({ atom, setProgress, context, packageDependencies }) {
    await setProgress({ message: "Creating tsconfig.json." });

    const templateContext = {
        atom: atom,
        packageDependencies:
            packageDependencies
    }

    const templateDir = context.templateDir;
    const template = nunjucks.compile(
        fs.readFileSync(path.resolve(templateDir, `tsconfig.json.njk`), "utf8"),
        nunjucks.configure(templateDir)
    );

    const templateRender = template.render(templateContext);

    const projectDir = context.projectDir;
    const filePath = path.resolve(projectDir, `tsconfig.json`);
    fs.writeFileSync(filePath, templateRender, 'utf8');
}