const fs = require("node:fs");
const path = require("node:path");
const nunjucks = require("nunjucks");

module.exports = async ({ atom, setInProgress, context, njEnv }) => {


    if (atom.doc.features.cli.enabled !== true) return;

    await setInProgress({ message: "Creating yargs." });

    const options = {};
    const inputs = atom.doc.inputs || [];
    const imports = [];

    inputs.forEach(input => {
        if (input.cli === false || !input.name) return;
        if (input.import) imports.push(input);

        const option = {};
        if (input.type) option.type = input.type;
        if (input.default) option.default = input.default;
        if (input.choices) option.choices = input.choices;
        if (input.describe || input.description) option.describe = input.describe || input.description;
        if (input.alias) option.alias = input.alias;
        if (input.required === true) option.required = true;
        if (input.hidden === true) option.hidden = true;
        if (input.array === true) option.array = true;
        if (input.normalize === true) option.normalize = true;
        if (input.nargs) option.nargs = input.nargs;

        options[input.name] = option;
    });

    const templateContext = { options, imports, atom: atom }

    const templateDir = context.templateDir;
    const template = nunjucks.compile(
        fs.readFileSync(path.resolve(templateDir, `src/default/to.yargs.js.njk`), "utf8"),
        njEnv
    );

    const templateRender = template.render(templateContext);

    const projectDir = context.projectDir;
    const filePath = path.resolve(projectDir, `src/default/to.yargs.js`);
    fs.writeFileSync(filePath, templateRender, 'utf8');

}