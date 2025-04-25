import fs from "node:fs";
import path from "node:path";
import nunjucks from "nunjucks";

export default async function createGitIgnore({ atom, setProgress, context, packageDependencies }) {
    await setProgress({ message: "Creating .gitignore" });

    const templateContext = {
        atom: atom,
        packageDependencies:
            packageDependencies
    }

    const templateDir = context.templateDir;
    const template = nunjucks.compile(
        fs.readFileSync(path.resolve(templateDir, `.gitignore.njk`), "utf8"),
        nunjucks.configure(templateDir)
    );

    const templateRender = template.render(templateContext);

    const projectDir = context.projectDir;
    const filePath = path.resolve(projectDir, `.gitignore`);
    fs.writeFileSync(filePath, templateRender, 'utf8');
}