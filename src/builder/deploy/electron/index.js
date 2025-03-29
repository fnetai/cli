import fnetConfig from '@fnet/config';
import fnetToElectron from '@flownet/lib-to-electron';
import cloneDeep from "lodash.clonedeep";
import semver from 'semver';

export default async function deployToElectron({
  atom,
  target,
  onProgress,
  projectDir,
  dependencies,
  context,
  yamlTarget
}) {

  const deployerName = 'electron';

  if (onProgress) await onProgress({ message: `Deploying it as ${deployerName} package.` });

  const config = target?.config ? await fnetConfig({
    name: target.config,
    dir: projectDir,
    optional: true,
    transferEnv:false,
    tags: context.tags
  }) : undefined;

  const nextVersion = semver.inc(target.version || "0.1.0", "patch");
  target.version = nextVersion;
  yamlTarget.set('version', nextVersion);

  const params = cloneDeep(target.params);

  params.dependencies = cloneDeep(dependencies);

  const args = {
    atom,
    params,
    config: config?.config,
    src: projectDir,
    dest: projectDir,
  }

  const result = await fnetToElectron(args);

  return {
    deployer: result,
  };
}