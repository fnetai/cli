import fs from "node:fs";
import path from "node:path";
import nunjucks from "nunjucks";
import Ajv from 'ajv/dist/2020.js';
import standaloneCode from 'ajv/dist/standalone/index.js';
import addFormats from 'ajv-formats';

export default async function createToYargs({ atom, setProgress, context, njEnv }) {

  if (atom.doc.features.cli.enabled !== true) return;

  await setProgress({ message: "Creating yargs." });

  let schema = {};
  const imports = [];

  const input = atom.doc.input;
  if (input) {
    schema = atom.doc.input;
  }
  else {
    schema = {
      type: "object",
      properties: {},
      required: []
    };
  };

  if (atom.doc.features.cli.fargs && atom.doc.features.cli.fargs?.enabled !== false) {

    const fargsOptions = atom.doc.features.cli.fargs;

    const fargs = { type: "string", description: "Config name to load args", hidden: false };
    const ftag = { type: "array", description: "Tags to filter the config", hidden: false };

    if (Reflect.has(fargsOptions, 'default')) fargs.default = fargsOptions.default;
    // if (Reflect.has(fargsOptions, 'describe') || Reflect.has(fargsOptions, 'description')) fargs.describe = fargsOptions.describe || fargsOptions.description;
    // if (Reflect.has(fargsOptions, 'choices')) fargs.choices = fargsOptions.choices;

    if (schema.properties) {
      schema.properties["fargs"] = fargs;
      schema.properties["ftag"] = ftag;
    }
  }

  const templateContext = { options: schema, imports, atom: atom }

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
    formats: { },
    strict: false,
    code: {
      esm: true,
      lines: true,
      optimize: false,
      source: true
    },
  });
  
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const validateCode = standaloneCode(ajv, validate);
  
  fs.writeFileSync(path.resolve(projectDir, `src/default/validate_input.js`), validateCode, 'utf8');
}