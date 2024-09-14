const fnetToElectron = require('@flownet/lib-to-electron');
const fnetConfig = require('@fnet/config');

module.exports = async ({ atom, setInProgress, context, deploymentProject, deploymentProjectTarget: target, buildId }) => {

  await setInProgress({ message: "Deploying it as electron package." });

  const projectDir = context.projectDir;

  if (target.dryRun === true) return;

  const config =target?.config? await fnetConfig({
    name: target.config,
    dir: context.projectDir,
    optional: true
  }):undefined;

  const args = {
    atom: atom,
    params: target.params,
    config:config?.config,
    src: projectDir,
    dest: projectDir,
  }

  await fnetToElectron(args);

  deploymentProject.isDirty = true;
}