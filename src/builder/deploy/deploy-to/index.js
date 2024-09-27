const deployToGitlab = require('../gitlab');
const deployToGcs = require('../gcs');
const deployToNpm = require('../npm');
const deployToNodeRed = require('../red');
const deployToAtom = require('../atom');
const deployToIosApp = require('../ios-app');
const deployToMacOSApp = require('../macos-app');
const deployToElectron = require('../electron');
const deployToWebos = require('../webos');
const deployToNextjs = require('../nextjs');
const deployToDocker = require('../docker');
const deployToFnetPackage = require('../fnet-package');
const deployToFnetForm = require('../fnet-form');
const deployToFnetFlow = require('../fnet-flow');
const deployToFnetNode = require('../fnet-node');
const deployToRust = require('../rust');

module.exports = async (apiContext) => {

  const { atom, packageDependencies, context, deploymentProjectTarget, setInProgress, deploymentProject } = apiContext;

  if (deploymentProjectTarget.enabled !== true) return;

  if (deploymentProjectTarget.name === "lib")
    await deployToAtom({ ...apiContext });
  else if (deploymentProjectTarget.name === "red")
    await deployToNodeRed({ ...apiContext });
  else if (deploymentProjectTarget.name === "npm")
    await deployToNpm({ ...apiContext });
  else if (deploymentProjectTarget.name === "gcs")
    await deployToGcs({ ...apiContext });
  else if (deploymentProjectTarget.name === "gitlab")
    await deployToGitlab({ ...apiContext });
  else if (deploymentProjectTarget.name === "fnet-package")
    await deployToFnetPackage({ ...apiContext });
  else if (deploymentProjectTarget.name === "fnet-form")
    await deployToFnetForm({ ...apiContext });
  else if (deploymentProjectTarget.name === "fnet-node")
    await deployToFnetNode({ ...apiContext });
  else if (deploymentProjectTarget.name === "fnet-flow")
    await deployToFnetFlow({ ...apiContext });
  else {
    let deployer;
    
    if (deploymentProjectTarget.name === 'nextjs') deployer = deployToNextjs;
    else if (deploymentProjectTarget.name === 'webos') deployer = deployToWebos;
    else if (deploymentProjectTarget.name === 'electron') deployer = deployToElectron;
    else if (deploymentProjectTarget.name === 'docker') deployer = deployToDocker;
    else if (deploymentProjectTarget.name === 'ios') deployer = deployToIosApp;
    else if (deploymentProjectTarget.name === 'macos') deployer = deployToMacOSApp;
    else if (deploymentProjectTarget.name === 'rust') deployer = deployToRust;

    if (!deployer) return;

    await deployer({
      atom: atom,
      target: deploymentProjectTarget,
      onProgress: setInProgress,
      projectDir: context.projectDir,
      dependencies: packageDependencies
    });

    deploymentProject.isDirty = true;
  }
}