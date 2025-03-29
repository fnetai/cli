import semver from 'semver';
import fnetConfig from '@fnet/config';
import fs from 'fs';
import fnetShellJs from '@fnet/shelljs';
import FormData from 'form-data';

export default async function deployToFnetNode({ setProgress, context, deploymentProject, deploymentProjectTarget: target, yamlTarget }) {

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

  const tokenResponse = await fetch(apiTokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to fetch token: ${tokenResponse.statusText}`);
  }

  const tokenData = await tokenResponse.json();
  const access_token = tokenData?.access_token;

  if (!access_token) throw new Error(`Invalid access_token from ${apiTokenUrl}`);

  deploymentProject.isDirty = true;
  const newVersion = semver.inc(target.version, "patch");
  target.params.version = newVersion; // TODO: remove this line
  target.version = newVersion;
  yamlTarget.set('version', newVersion);
  
  const url = `${config.env.ATOM_API_URL}/v1/service/fnet-node/publish`;

  const publishResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${access_token}`
    },
    body: JSON.stringify({
      name: target.params.name,
      version: target.params.version,
      docs: target.params.docs,
      configs: target.params.configs,
    })
  });

  if (!publishResponse.ok) {
    throw new Error(`Error publishing fnet node: ${publishResponse.statusText}`);
  }

  const publishData = await publishResponse.json();

  if (publishData?.error) throw new Error('Error publishing fnet node.');

  const upload_session_id = publishData?.upload.id;

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

  const uploadResponse = await fetch(`${config.env.ATOM_API_URL}/v1/service/upload/single/${upload_session_id}`, {
    method: 'POST',
    headers: {
      ...formData.getHeaders(),
      "Authorization": `Bearer ${access_token}`
    },
    body: formData
  });

  if (!uploadResponse.ok) {
    throw new Error(`Error uploading fnet node: ${uploadResponse.statusText}`);
  }

  const uploadResult = await uploadResponse.json();

  if (uploadResult?.error) throw new Error('Error uploading fnet node.');
}