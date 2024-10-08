const fs = require('node:fs');
const path = require('node:path');
const semver = require('semver');
const shell = require('shelljs');

const fnetConfig = require('@fnet/config');
const fnetUpListFiles = require('@fnet/up-list-files');
const fnetObjectFromSchema = require('@fnet/object-from-schema');
const yaml = require('yaml');

module.exports = async ({ atom, setInProgress, context, deploymentProject, deploymentProjectTarget: target, yamlTarget }) => {

  await setInProgress({ message: "Deploying it as npm package." });

  const projectDir = context.projectDir;
  const packageJSONPath = path.resolve(projectDir, 'package.json');

  const packageJSONContent = fs.readFileSync(packageJSONPath);

  const packageJSON = JSON.parse(packageJSONContent);

  packageJSON.name = target.params.name;

  packageJSON.version = semver.inc(target.version, "patch");

  const binName = target.params.bin?.name || target.params.bin;
  const binEnabled = target.params.bin?.enabled !== false;

  if (binEnabled && binName && typeof binName === 'string') {
    packageJSON.bin = {
      [binName]: 'dist/cli/esm/index.js',
      [atom.doc.name]: 'dist/cli/esm/index.js'
    }
  }

  delete packageJSON.scripts;
  delete packageJSON.devDependencies;

  packageJSON.scripts = {
    "serve": "npx serve ."
  }

  fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSON, null, "\t"));

  // TODO: improve this for all builders/deploys
  const configName= target.config || "npm";
  let npmConfig = (await fnetConfig({ name: configName, dir: context.projectDir, tags: context.tags, optional: true }))?.data;
  
  if (!npmConfig) {
    // create config from schema
    const schemas = await fnetUpListFiles({ pattern: '@fnet/cli-project-schemas/dist/schemas/to-npm.yaml', absolute: true });
    if (schemas.length === 0) throw new Error('Couldnt find schema to create npm config');
    const newConfig = await fnetObjectFromSchema({ schema: schemas[0], tags: context.tags });

    const projectDir = context.project.projectDir;
    const dotFnetDir = path.resolve(projectDir, '.fnet');
    if (!fs.existsSync(dotFnetDir)) fs.mkdirSync(dotFnetDir);
    fs.writeFileSync(path.resolve(dotFnetDir, `${configName}.fnet`), yaml.stringify(newConfig));
    npmConfig = newConfig;
  }

  fs.writeFileSync(path.resolve(projectDir, '.npmrc'), `//registry.npmjs.org/:_authToken=${npmConfig.env.NPM_TOKEN}`);

  if (target.dryRun === true) return;

  let result = shell.exec(`npm publish --access public`, { cwd: projectDir });
  if (result.code !== 0) throw new Error('Couldnt publish to npm');

  // restore
  fs.writeFileSync(packageJSONPath, packageJSONContent);

  deploymentProject.isDirty = true;

  target.version = packageJSON.version;
  yamlTarget.set('version', packageJSON.version);
}