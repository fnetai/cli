const fnetConfig = require('@fnet/config');
const fnetDeployer = require('@flownet/lib-to-docker');

const cloneDeep = require("lodash.clonedeep");
const semver = require('semver');

module.exports = async ({
  atom,
  target,
  onProgress,
  projectDir,
  dependencies,
  context,
}) => {

  const deployerName = 'docker';

  if (onProgress) await onProgress({ message: `Deploying it as ${deployerName} package.` });

  const config = target?.config ? await fnetConfig({
    name: target.config,
    dir: projectDir,
    optional: true,
    transferEnv: false,
    tags: context.tags
  }) : undefined;

  const nextVersion = semver.inc(target.params.version || "0.1.0", "patch");
  target.params.version = nextVersion;

  const params = cloneDeep(target.params);

  params.dependencies = cloneDeep(dependencies);

  const args = {
    atom,
    params,
    config: config?.config,
    src: projectDir,
    dest: projectDir,
  }

  const result = await fnetDeployer(args);

  return {
    deployer: result,
  };
}