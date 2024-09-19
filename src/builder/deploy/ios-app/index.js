
const fnetConfig = require('@fnet/config');
const fnetToIOSApp = require('@flownet/lib-to-ios-app');

const cloneDeep = require("lodash.clonedeep");
const semver = require('semver');

module.exports = async ({
  atom,
  target,
  onProgress,
  projectDir,
  dependencies
}) => {

  const deployerName = 'ios-app';

  if (onProgress) await onProgress({ message: `Deploying it as ${deployerName} package.` });

  const config = target?.config ? await fnetConfig({
    name: target.config,
    dir: projectDir,
    optional: true,
    transferEnv:false
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

  const result = await fnetToIOSApp(args);

  return {
    deployer: result,
  };
}