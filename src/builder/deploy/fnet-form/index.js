const semver = require('semver');
const fnetConfig = require('@fnet/config');

module.exports = async ({ setProgress, context, deploymentProject, deploymentProjectTarget: target, yamlTarget }) => {

  await setProgress({ message: "Deploying it as fnet form." });

  const { file: configFile, data: config } = await fnetConfig({
    name: target.config || "fnet-form",
    dir: context.projectDir,
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
  const url = `${config.env.ATOM_API_URL}/v1/service/fnet-form/publish`;

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
    throw new Error(`Error publishing fnet form: ${publishResponse.statusText}`);
  }

  const publishData = await publishResponse.json();

  if (publishData?.error) throw new Error('Error publishing fnet form.');
}