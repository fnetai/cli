const fs = require("node:fs");
const path = require("node:path");
const nunjucks = require("nunjucks");
// const fnetYargsOptionsFromSchema = require("@fnet/yargs-options-from-schema");
// const fnetYaml = require("@fnet/yaml");
const Ajv = require('ajv/dist/2020');

module.exports = async ({ atom, setInProgress, context, njEnv }) => {

  if (atom.doc.features.cli.enabled !== true) return;

  await setInProgress({ message: "Creating yargs." });

  let options = {};
  // const inputs = atom.doc.inputs || [];
  const imports = [];

  const input = atom.doc.input;
  if (input) {
    // options = await fnetYargsOptionsFromSchema({ schema: input });
    options = atom.doc.input;
  }
  else {
    // define basic schema
    options = {
      type: "object",
      properties: {},
      required: []
    };
  };

  // else
  //   inputs.forEach(input => {
  //     if (input.cli === false || !input.name) return;
  //     if (input.import) imports.push(input);

  //     const option = {};

  //     if (Reflect.has(input, 'type')) option.type = input.type;
  //     if (Reflect.has(input, 'default')) option.default = input.default;
  //     if (Reflect.has(input, 'choices')) option.choices = input.choices;
  //     if (Reflect.has(input, 'describe') || Reflect.has(input, 'description')) {
  //       option.describe = input.describe || input.description;
  //     }
  //     if (Reflect.has(input, 'alias')) option.alias = input.alias;
  //     if (Reflect.has(input, 'required') && input.required === true) option.required = true;
  //     if (Reflect.has(input, 'hidden') && input.hidden === true) option.hidden = true;
  //     if (Reflect.has(input, 'array') && input.array === true) option.array = true;
  //     if (Reflect.has(input, 'normalize') && input.normalize === true) option.normalize = true;
  //     if (Reflect.has(input, 'nargs')) option.nargs = input.nargs;

  //     options[input.name] = option;
  //   });

  if (atom.doc.features.cli.fargs && atom.doc.features.cli.fargs?.enabled !== false) {

    const fargsOptions = atom.doc.features.cli.fargs;

    const fargs = { type: "string", description: "Config name to load args", hidden: false };
    const ftag = { type: "array", description: "Tags to filter the config", hidden: false };

    if (Reflect.has(fargsOptions, 'default')) fargs.default = fargsOptions.default;
    // if (Reflect.has(fargsOptions, 'describe') || Reflect.has(fargsOptions, 'description')) fargs.describe = fargsOptions.describe || fargsOptions.description;
    // if (Reflect.has(fargsOptions, 'choices')) fargs.choices = fargsOptions.choices;

    if (options.properties) {
      options.properties["fargs"] = fargs;
      options.properties["ftag"] = ftag;
    }
  }

  const templateContext = { options, imports, atom: atom }

  const templateDir = context.templateDir;
  const template = nunjucks.compile(
    fs.readFileSync(path.resolve(templateDir, `src/default/to.args.js.njk`), "utf8"),
    njEnv
  );

  const templateRender = template.render(templateContext);

  const projectDir = context.projectDir;
  const filePath = path.resolve(projectDir, `src/default/to.args.js`);
  fs.writeFileSync(filePath, templateRender, 'utf8');

  const ajv = new Ajv({
    allErrors: true,
    useDefaults: true,
    // formats: { email: true },
    strict: false,
    code: {
      esm: true,
      // lines: true,
      // optimize: false
    },
  });

  const validate = ajv.compile(atom.doc.input);

  const validateFunctionCode = `export default ${validate.toString()};`;

  fs.writeFileSync(path.resolve(projectDir, `src/default/validate_input.js`), validateFunctionCode, 'utf8');
}