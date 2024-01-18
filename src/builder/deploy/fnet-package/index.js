const fs = require('node:fs');
const path = require('node:path');
const semver = require('semver');

const fnetShell = require('@fnet/shell');
const fnetConfig = require('@fnet/config');

const axios = require('axios').default;

module.exports = async ({ setInProgress, context, deploymentProject, deploymentProjectTarget: target, registerToPackageManager }) => {

  await setInProgress({ message: "Deploying it as fnet package." });

  const projectDir = context.projectDir;
  const packageJSONPath = path.resolve(projectDir, 'package.json');

  const packageJSONContent = fs.readFileSync(packageJSONPath);

  const packageJSON = JSON.parse(packageJSONContent);

  packageJSON.name = target.params.name;
  packageJSON.version = semver.inc(target.params.version, "patch");

  delete packageJSON.scripts;
  delete packageJSON.devDependencies;

  fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSON, null, "\t"));

  const { file: configFile, data: config } = await fnetConfig({
    name: target.params.config || context.gcsConfig || "fnet-package",
    dir: context.projectDir
  });


  if (!config.env.ATOM_API_URL) throw new Error(`ATOM_API_URL is required in ${configFile}`);
  if (!config.env.ATOM_API_USERNAME) throw new Error(`ATOM_API_USERNAME is required in ${configFile}`);
  if (!config.env.ATOM_API_PASSWORD) throw new Error(`ATOM_API_PASSWORD is required in ${configFile}`);

  const apiUrl = `${config.env.ATOM_API_URL}/v1/auth/token`;
  const username = config.env.ATOM_API_USERNAME;
  const password = config.env.ATOM_API_PASSWORD;

  let response = await axios({
    method: "POST",
    url: apiUrl,
    data: {
      username,
      password
    },
    headers: {
      "Content-Type": "application/json"
    },
  });

  const access_token = response.data?.access_token;
  if (!access_token) throw new Error(`Invalid access_token from ${apiUrl}`);

  let command = `fnet-upload-files-to-gcs`;
  command += ` --projectId='${config.env.GCS_PROJECT_ID}'`;
  command += ` --bucketName='${config.env.GCS_BUCKET_NAME}'`;
  command += ` --keyFilename='${path.resolve(path.dirname(configFile), config.env.GCS_UPLOADER_KEY_FILE)}'`;
  command += ` --dir='${projectDir}'`;
  command += ` --pattern={'dist/**/**','bin/**/**','test/**/**','*.html'}`;
  command += ` --destDir='${packageJSON.name}/${packageJSON.version}'`;
  command += ` --metadata.cacheControl='public, max-age=31536000, immutable'`;
  command += ` --verbose`;

  if (config.env.DOMAIN) command += ` --domain='${config.env.DOMAIN}'`;

  if (target.dry_run === true || target.params.dry_run === true) command += ` --dryRun`;

  await fnetShell({ cmd: command });

  // restore
  fs.writeFileSync(packageJSONPath, packageJSONContent);

  if (target.dryRun === true) return;

  deploymentProject.isDirty = true;
  target.params.version = packageJSON.version;

  const url = `${config.env.ATOM_API_URL}/v1/service/fnet-package/publish`;
  response = await axios({
    method: "POST",
    url,
    data: {
      name: packageJSON.name,
      version: packageJSON.version,
      version_domain: config.env.DOMAIN,
      docs: target.params.docs,
      configs: target.params.configs,
    },
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${access_token}`
    },
  });

  if (response.data?.error) throw new Error(response.data.error);
}