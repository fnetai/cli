const fs = require("node:fs");
const path = require("node:path");
const nunjucks = require("nunjucks");

module.exports = async ({ atom, setProgress, context, packageDependencies }) => {
    await setProgress({ message: "Creating .gitignore" });

    const templateContext = {
        atom: atom,
        packageDependencies:
            packageDependencies
    }

    const templateDir = context.templateCommonDir;
    const template = nunjucks.compile(
        fs.readFileSync(path.resolve(templateDir, `.gitignore.njk`), "utf8"),
        nunjucks.configure(templateDir)
    );

    const templateRender = template.render(templateContext);

    const projectDir = context.projectDir;
    const filePath = path.resolve(projectDir, `.gitignore`);
    fs.writeFileSync(filePath, templateRender, 'utf8');    
}