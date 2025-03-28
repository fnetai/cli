const semver = require('semver');
const fnetConfig = require('@fnet/config');
const axios = require('axios').default;
const fs = require('fs');
const fnetShellJs = require('@fnet/shelljs');
const FormData = require('form-data');

module.exports = async ({ setProgress, context, deploymentProject, deploymentProjectTarget: target,yamlTarget }) => {

  await setProgress({ message: "Deploying it as fnet node." });

  const { file: configFile, data: config } = await fnetConfig({
    name: target.config || "fnet-node",
    dir: context.project.projectDir,
    tags: context.tags
  });

  if (!config.env.ATOM_API_URL) throw new Error(`ATOM_API_URL is required in ${configFile}`);
  if (!config.env.ATOM_API_USERNAME) throw new Error(`ATOM_API_USERNAME is required in ${configFile}`);
  if (!config.env.ATOM_API_PASSWORD) throw new Error(`ATOM_API_PASSWORD is required in ${configFile}`);

  const apiTokenUrl = `${config.env.ATOM_API_URL}/v1/auth/token`;
  const username = config.env.ATOM_API_USERNAME;
  const password = config.env.ATOM_API_PASSWORD;

  let response = await axios({
    method: "POST",
    url: apiTokenUrl,
    data: {
      username,
      password
    },
    headers: {
      "Content-Type": "application/json"
    },
  });

  const access_token = response.data?.access_token;

  if (!access_token) throw new Error(`Invalid access_token from ${apiTokenUrl}`);

  deploymentProject.isDirty = true;
  const newVersion = semver.inc(target.version, "patch");
  target.params.version = newVersion; // TODO: remove this line
  target.version = newVersion;
  yamlTarget.set('version', newVersion);
  
  const url = `${config.env.ATOM_API_URL}/v1/service/fnet-node/publish`;

  response = await axios({
    method: "POST",
    url,
    data: {
      name: target.params.name,
      version: target.params.version,
      docs: target.params.docs,
      configs: target.params.configs,
    },
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${access_token}`
    },
  });

  if (response.data?.error) throw new Error('Error publishing fnet node.');

  const upload_session_id = response.data?.upload.id;

  let command = `fnet-dir-zipper`;
  command += ` --sourceDir='${context.project.projectDir}'`;
  command += ` --pattern=**/*`;
  command += ` --stdout_format=json`;
  
  const shResult = await fnetShellJs(command);
  if (shResult.code !== 0) throw new Error(shResult.stderr);

  const zipData = JSON.parse(shResult.stdout);
  const zipFilePath = zipData.path;

  let formData = new FormData();
  formData.append('file', fs.createReadStream(zipFilePath));

  const uploadResult = await axios.request({
    method: 'POST',
    maxBodyLength: Infinity,
    url: `${config.env.ATOM_API_URL}/v1/service/upload/single/${upload_session_id}`,
    headers: {
      ...formData.getHeaders(),
      "Authorization": `Bearer ${access_token}`
    },
    data: formData
  });

  if (uploadResult.data?.error) throw new Error('Error uploading fnet node.');
}