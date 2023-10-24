const fnetToElectron = require('@flownet/lib-to-electron');

module.exports = async ({atom, setInProgress, context, deploymentProject, deploymentProjectTarget: target, buildId }) => {

    await setInProgress({ message: "Deploying it as electron package." });

    const projectDir = context.projectDir;

    if (target.dryRun === true) return;

    const args = {
        src: projectDir,
        dest: projectDir,
        atom: atom,
        params: target.params
    }

    await fnetToElectron(args);

    deploymentProject.isDirty = true;
}