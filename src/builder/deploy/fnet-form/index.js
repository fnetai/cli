const semver = require('semver');
const fnetConfig = require('@fnet/config');
const axios = require('axios').default;

module.exports = async ({ setInProgress, context, deploymentProject, deploymentProjectTarget: target }) => {

  await setInProgress({ message: "Deploying it as fnet form." });

  const newVersion = semver.inc(target.params.version, "patch");

  const { file: configFile, data: config } = await fnetConfig({
    name: target.config || "fnet-form",
    dir: context.projectDir
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
  target.params.version = newVersion;

  const url = `${config.env.ATOM_API_URL}/v1/service/fnet-form/publish`;

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

  if (response.data?.error) throw new Error('Error publishing fnet form.');
}