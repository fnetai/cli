const fnetToWebos = require('@flownet/lib-to-webos');

module.exports = async ({ atom, setInProgress, context, deploymentProject, deploymentProjectTarget: target }) => {

    await setInProgress({ message: "Deploying it as webos package." });

    const projectDir = context.projectDir;

    if (target.dryRun === true) return;
    
    const args = {
        src: projectDir,
        dest: projectDir,
        atom: atom,
        params: target.params
    }

    await fnetToWebos(args);

    deploymentProject.isDirty = true;
}