const fnetToMacOSApp = require('@flownet/lib-to-macos-app');

module.exports = async ({atom, setInProgress, context, deploymentProject, deploymentProjectTarget: target, buildId }) => {

    await setInProgress({ message: "Deploying it as macos app package." });

    const projectDir = context.projectDir;

    if (target.dryRun === true) return;
    
    const args = {
        projectDir,
        dest: projectDir,
        atom: atom,
        params: target.params
    }

    await fnetToMacOSApp(args);

    deploymentProject.isDirty = true;
}