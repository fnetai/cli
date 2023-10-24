const fnetToIOSApp = require('@flownet/lib-to-ios-app');

module.exports = async ({atom, setInProgress, context, deploymentProject, deploymentProjectTarget: target, buildId,registerToPackageManager }) => {

    await setInProgress({ message: "Deploying it as ios app package." });

    const projectDir = context.projectDir;

    if (target.dryRun === true) return;
    
    const args = {
        projectDir,
        dest: projectDir,
        atom: atom,
        params: target.params
    }

    await fnetToIOSApp(args);

    deploymentProject.isDirty = true;
}