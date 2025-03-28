const fnetShellJs = require('@fnet/shelljs');
const fnetConfig = require('@fnet/config');

module.exports = async ({ setProgress, context, deploymentProject, deploymentProjectTarget, buildId }) => {

    await setProgress({ message: "Deploying it as gitlab project." });

    const projectDir = context.projectDir;

    let command = `fnet-to-gitlab`;

    const configKey = deploymentProjectTarget.params.config || 'gitlab';

    const config = await fnetConfig({
        name: configKey,
        dir: context.projectDir,
        tags: context.tags
    });

    if (!config) throw new Error(`Couldnt load config ${configKey}`);

    const { data: inputs } = config.data;

    command += ` --projectGroupId=${inputs.projectGroupId}`;
    command += ` --projectPath='${projectDir}'`;
    command += ` --projectName='${deploymentProjectTarget.params.name}'`;
    command += ` --projectBranch='${deploymentProjectTarget.params.branch || 'main'}'`;

    command += ` --gitlabHost='${inputs.gitlabHost}'`;
    command += ` --gitlabToken='${inputs.gitlabToken}'`;
    command += ` --gitlabUsername='${inputs.gitlabUsername}'`;
    command += ` --gitlabUserEmail='${inputs.gitlabUserEmail}'`;

    if (deploymentProjectTarget.dryRun === true) return;

    await fnetShellJs(command);

    deploymentProject.isDirty = true;
}