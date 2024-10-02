const fs = require('node:fs');
const path = require('node:path');
const semver = require('semver');
const shell = require('shelljs');

const fnetConfig = require('@fnet/config');

module.exports = async ({ atom, setInProgress, context, deploymentProject, deploymentProjectTarget: target, yamlTarget }) => {

  await setInProgress({ message: "Deploying it as npm package." });

  const projectDir = context.projectDir;
  const packageJSONPath = path.resolve(projectDir, 'package.json');

  const packageJSONContent = fs.readFileSync(packageJSONPath);

  const packageJSON = JSON.parse(packageJSONContent);

  packageJSON.name = target.params.name;

  packageJSON.version = semver.inc(target.params.version, "patch");

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

  const npmConfig = (await fnetConfig({ name: context.npmConfig || "npm", dir: context.projectDir, tags: context.tags }))?.data;

  fs.writeFileSync(path.resolve(projectDir, '.npmrc'), `//registry.npmjs.org/:_authToken=${npmConfig.env.NPM_TOKEN}`);

  if (target.dryRun === true) return;

  let result = shell.exec(`npm publish --access public`, { cwd: projectDir });
  if (result.code !== 0) throw new Error('Couldnt publish to npm');

  // restore
  fs.writeFileSync(packageJSONPath, packageJSONContent);

  deploymentProject.isDirty = true;

  target.params.version = packageJSON.version;
  yamlTarget.get('params').set('version', packageJSON.version);
}