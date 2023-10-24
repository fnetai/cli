const deployToGitlab = require('../gitlab');
const deployToPm = require('../pm');
const deployToNpm = require('../npm');
const deployToNodeRed = require('../red');
const deployToAtom = require('../atom');
const deployToIosApp = require('../ios-app');
const deployToMacOSApp = require('../macos-app');
const deployToElectron = require('../electron');
const deployToWebos = require('../webos');
const deployToNextjs = require('../nextjs');

module.exports = async (apiContext) => {

    const { atom, packageDependencies, context, deploymentProjectTarget, setInProgress } = apiContext;

    if (deploymentProjectTarget.enabled !== true) return;

    if (deploymentProjectTarget.name === "lib")
        await deployToAtom({ ...apiContext });
    else if (deploymentProjectTarget.name === "red")
        await deployToNodeRed({ ...apiContext });
    else if (deploymentProjectTarget.name === "npm")
        await deployToNpm({ ...apiContext });
    else if (deploymentProjectTarget.name === "gcs")
        await deployToPm({ ...apiContext });
    else if (deploymentProjectTarget.name === "gitlab")
        await deployToGitlab({ ...apiContext });
    else if (deploymentProjectTarget.name === "macos-app")
        await deployToMacOSApp({ ...apiContext });
    else if (deploymentProjectTarget.name === "ios-app")
        await deployToIosApp({ ...apiContext });
    else if (deploymentProjectTarget.name === "electron")
        await deployToElectron({ ...apiContext });
    else if (deploymentProjectTarget.name === "webos")
        await deployToWebos({ ...apiContext });
    else {
        let deployer;

        if (deploymentProjectTarget.name === 'nextjs') deployer = deployToNextjs;

        if (!deployer) return;

        await deployer({
            atom: atom,
            target: deploymentProjectTarget,
            onProgress: setInProgress,
            projectDir: context.projectDir,
            dependencies: packageDependencies
        });
    }
}