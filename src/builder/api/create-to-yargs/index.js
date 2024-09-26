const fs = require("node:fs");
const path = require("node:path");
const nunjucks = require("nunjucks");
const fnetYargsOptionsFromSchema = require("@fnet/yargs-options-from-schema");

module.exports = async ({ atom, setInProgress, context, njEnv }) => {


  if (atom.doc.features.cli.enabled !== true) return;

  await setInProgress({ message: "Creating yargs." });

  let options = {};
  const inputs = atom.doc.inputs || [];
  const imports = [];

  const input = atom.doc.input;
  if (input) {
    options = await fnetYargsOptionsFromSchema({ schema: input });
  }
  else
    inputs.forEach(input => {
      if (input.cli === false || !input.name) return;
      if (input.import) imports.push(input);

      const option = {};

      if (Reflect.has(input, 'type')) option.type = input.type;
      if (Reflect.has(input, 'default')) option.default = input.default;
      if (Reflect.has(input, 'choices')) option.choices = input.choices;
      if (Reflect.has(input, 'describe') || Reflect.has(input, 'description')) {
        option.describe = input.describe || input.description;
      }
      if (Reflect.has(input, 'alias')) option.alias = input.alias;
      if (Reflect.has(input, 'required') && input.required === true) option.required = true;
      if (Reflect.has(input, 'hidden') && input.hidden === true) option.hidden = true;
      if (Reflect.has(input, 'array') && input.array === true) option.array = true;
      if (Reflect.has(input, 'normalize') && input.normalize === true) option.normalize = true;
      if (Reflect.has(input, 'nargs')) option.nargs = input.nargs;

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