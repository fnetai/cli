const fs = require("node:fs");
const path = require("node:path");
const nunjucks = require("nunjucks");

module.exports = async ({ atom, setProgress, context, packageDependencies }) => {
    await setProgress({ message: "Creating tsconfig.json." });

    const templateContext = {
        atom: atom,
        packageDependencies:
            packageDependencies
    }

    const templateDir = context.templateCommonDir;
    const template = nunjucks.compile(
        fs.readFileSync(path.resolve(templateDir, `tsconfig.json.njk`), "utf8"),
        nunjucks.configure(templateDir)
    );

    const templateRender = template.render(templateContext);

    const projectDir = context.projectDir;
    const filePath = path.resolve(projectDir, `tsconfig.json`);
    fs.writeFileSync(filePath, templateRender, 'utf8');
}