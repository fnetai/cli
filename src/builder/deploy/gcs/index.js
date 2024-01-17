const fs = require('node:fs');
const path = require('node:path');
const semver = require('semver');

const fnetShell = require('@fnet/shell');
const fnetConfig = require('@fnet/config');

const axios = require('axios').default;

module.exports = async ({ setInProgress, context, deploymentProject, deploymentProjectTarget: target, registerToPackageManager }) => {

  await setInProgress({ message: "Deploying it as gcs package." });

  const projectDir = context.projectDir;
  const packageJSONPath = path.resolve(projectDir, 'package.json');

  const packageJSONContent = fs.readFileSync(packageJSONPath);

  const packageJSON = JSON.parse(packageJSONContent);

  packageJSON.name = target.params.name;
  packageJSON.version = semver.inc(target.params.version, "patch");

  delete packageJSON.scripts;
  delete packageJSON.devDependencies;

  fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSON, null, "\t"));

  const { file: pmFile, data: gcsConfig } = await fnetConfig({
    name: target.params.config || context.gcsConfig || "gcs",
    dir: context.projectDir
  });

  const register = {};

  if (target.register?.atom === true) {
    if (!gcsConfig.env.ATOM_API_URL) throw new Error(`ATOM_API_URL is required in ${pmFile}`);
    if (!gcsConfig.env.ATOM_API_USERNAME) throw new Error(`ATOM_API_USERNAME is required in ${pmFile}`);
    if (!gcsConfig.env.ATOM_API_PASSWORD) throw new Error(`ATOM_API_PASSWORD is required in ${pmFile}`);

    const apiUrl = `${gcsConfig.env.ATOM_API_URL}/v1/auth/token`;
    const username = gcsConfig.env.ATOM_API_USERNAME;
    const password = gcsConfig.env.ATOM_API_PASSWORD;

    const response = await axios({
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

    register.atom_api_url = gcsConfig.env.ATOM_API_URL;
    register.atom_access_token = access_token;

    // console.log(response.data);
  }

  let command = `fnet-upload-files-to-gcs`;
  command += ` --projectId='${gcsConfig.env.GCS_PROJECT_ID}'`;
  command += ` --bucketName='${gcsConfig.env.GCS_BUCKET_NAME}'`;
  command += ` --keyFilename='${path.resolve(path.dirname(pmFile), gcsConfig.env.GCS_UPLOADER_KEY_FILE)}'`;
  command += ` --dir='${projectDir}'`;
  command += ` --pattern={'dist/**/**','bin/**/**','test/**/**','*.html'}`;
  command += ` --destDir='${packageJSON.name}/${packageJSON.version}'`;
  command += ` --metadata.cacheControl='public, max-age=31536000, immutable'`;
  command += ` --verbose`;

  if (gcsConfig.env.DOMAIN) command += ` --domain='${gcsConfig.env.DOMAIN}'`;

  if (target.dryRun === true) command += ` --dryRun`;

  await fnetShell({ cmd: command });

  // restore
  fs.writeFileSync(packageJSONPath, packageJSONContent);

  if (target.dryRun === true) return;

  deploymentProject.isDirty = true;
  target.params.version = packageJSON.version;

  if (target.register?.atom === true) {
    const url = `${register.atom_api_url}/v1/service/fnet-package/publish`;
    const response = await axios({
      method: "POST",
      url,
      data: {
        name: packageJSON.name,
        version: packageJSON.version,
        version_domain: gcsConfig.env.DOMAIN
      },
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${register.atom_access_token}`
      },
    });
    // console.log(response.data);
  }
  await registerToPackageManager({ target, packageJSON });
}