import fnetConfig from '@fnet/config';
import fnetDeploy from '@fnet/to-rust';
import cloneDeep from "lodash.clonedeep";
import semver from 'semver';

export default async function deployToRust({
  atom,
  target,
  onProgress,
  projectDir,
  dependencies,
  context,
  yamlTarget
}) {

  const deployerName = 'Rust';

  if (onProgress) await onProgress({ message: `Deploying it as ${deployerName} package.` });

  const config = target?.config ? await fnetConfig({
    name: target.config,
    dir: projectDir,
    optional: true,
    transferEnv:false,
    tags: context.tags
  }) : undefined;

  const nextVersion = semver.inc(target.version || "0.1.0", "patch");
  target.params.version = nextVersion; // TODO: remove this line
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

  const result = await fnetDeploy(args);

  return {
    deployer: result,
  };
}