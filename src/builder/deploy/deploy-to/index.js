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
const deployToPyip = require('../pyip');

module.exports = async (apiContext) => {

  const { atom, packageDependencies, context, deploymentProjectTarget, setProgress, deploymentProject, yamlTarget } = apiContext;

  if (deploymentProjectTarget.enabled !== true) return;

  if (deploymentProjectTarget.type === "lib")
    await deployToAtom({ ...apiContext });
  else if (deploymentProjectTarget.type === "red")
    await deployToNodeRed({ ...apiContext });
  else if (deploymentProjectTarget.type === "npm")
    await deployToNpm({ ...apiContext });
  else if (deploymentProjectTarget.type === "gcs")
    await deployToGcs({ ...apiContext });
  else if (deploymentProjectTarget.type === "gitlab")
    await deployToGitlab({ ...apiContext });
  else if (deploymentProjectTarget.type === "fnet-package")
    await deployToFnetPackage({ ...apiContext });
  else if (deploymentProjectTarget.type === "fnet-form")
    await deployToFnetForm({ ...apiContext });
  else if (deploymentProjectTarget.type === "fnet-node")
    await deployToFnetNode({ ...apiContext });
  else if (deploymentProjectTarget.type === "fnet-flow")
    await deployToFnetFlow({ ...apiContext });
  else {
    let deployer;

    if (deploymentProjectTarget.type === 'nextjs') deployer = deployToNextjs;
    else if (deploymentProjectTarget.type === 'webos') deployer = deployToWebos;
    else if (deploymentProjectTarget.type === 'electron') deployer = deployToElectron;
    else if (deploymentProjectTarget.type === 'docker') deployer = deployToDocker;
    else if (deploymentProjectTarget.type === 'ios') deployer = deployToIosApp;
    else if (deploymentProjectTarget.type === 'macos') deployer = deployToMacOSApp;
    else if (deploymentProjectTarget.type === 'rust') deployer = deployToRust;
    else if (deploymentProjectTarget.type === 'pyip') deployer = deployToPyip;

    if (!deployer) return;

    await deployer({
      atom: atom,
      target: deploymentProjectTarget,
      onProgress: setProgress,
      projectDir: context.projectDir,
      dependencies: packageDependencies,
      context: context,
      yamlTarget: yamlTarget,
    });

    deploymentProject.isDirty = true;
  }
}