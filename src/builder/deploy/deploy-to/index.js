export default async (apiContext) => {

  // Destructure the apiContext to get needed variables
  const {
    atom,
    packageDependencies,
    context,
    deploymentProjectTarget,
    setProgress,
    deploymentProject,
    yamlTarget
  } = apiContext;

  // Early exit if the target is not enabled
  if (deploymentProjectTarget.enabled !== true) return;

  const type = deploymentProjectTarget.type;

  try {
    // Handle the first set of deployment types
    if (type === "lib") {
      await (await import('../atom/index.js')).default({ ...apiContext });
    } else if (type === "red") {
      await (await import('../red/index.js')).default({ ...apiContext });
    } else if (type === "npm") {
      await (await import('../npm/index.js')).default({ ...apiContext });
    } else if (type === "gcs") {
      await (await import('../gcs/index.js')).default({ ...apiContext });
    } else if (type === "gitlab") {
      await (await import('../gitlab/index.js')).default({ ...apiContext });
    } else if (type === "fnet-package") {
      await (await import('../fnet-package/index.js')).default({ ...apiContext });
    } else if (type === "fnet-form") {
      await (await import('../fnet-form/index.js')).default({ ...apiContext });
    } else if (type === "fnet-node") {
      await (await import('../fnet-node/index.js')).default({ ...apiContext });
    } else if (type === "fnet-flow") {
      await (await import('../fnet-flow/index.js')).default({ ...apiContext });
    }
    // Handle the second set of deployment types
    else if (type === 'nextjs') {
      await (await import('../nextjs/index.js')).default({
        atom,
        target: deploymentProjectTarget,
        onProgress: setProgress,
        projectDir: context.projectDir,
        dependencies: packageDependencies,
        context,
        yamlTarget
      });
      deploymentProject.isDirty = true;
    } else if (type === 'webos') {
      await (await import('../webos/index.js')).default({
        atom,
        target: deploymentProjectTarget,
        onProgress: setProgress,
        projectDir: context.projectDir,
        dependencies: packageDependencies,
        context,
        yamlTarget
      });
      deploymentProject.isDirty = true;
    } else if (type === 'electron') {
      await (await import('../electron/index.js')).default({
        atom,
        target: deploymentProjectTarget,
        onProgress: setProgress,
        projectDir: context.projectDir,
        dependencies: packageDependencies,
        context,
        yamlTarget
      });
      deploymentProject.isDirty = true;
    } else if (type === 'docker') {
      await (await import('../docker/index.js')).default({
        atom,
        target: deploymentProjectTarget,
        onProgress: setProgress,
        projectDir: context.projectDir,
        dependencies: packageDependencies,
        context,
        yamlTarget
      });
      deploymentProject.isDirty = true;
    } else if (type === 'ios') {
      await (await import('../ios-app/index.js')).default({
        atom,
        target: deploymentProjectTarget,
        onProgress: setProgress,
        projectDir: context.projectDir,
        dependencies: packageDependencies,
        context,
        yamlTarget
      });
      deploymentProject.isDirty = true;
    } else if (type === 'macos') {
      await (await import('../macos-app/index.js')).default({
        atom,
        target: deploymentProjectTarget,
        onProgress: setProgress,
        projectDir: context.projectDir,
        dependencies: packageDependencies,
        context,
        yamlTarget
      });
      deploymentProject.isDirty = true;
    } else if (type === 'rust') {
      await (await import('../rust/index.js')).default({
        atom,
        target: deploymentProjectTarget,
        onProgress: setProgress,
        projectDir: context.projectDir,
        dependencies: packageDependencies,
        context,
        yamlTarget
      });
      deploymentProject.isDirty = true;
    } else if (type === 'pypi') {
      await (await import('../pypi/index.js')).default({
        atom,
        target: deploymentProjectTarget,
        onProgress: setProgress,
        projectDir: context.projectDir,
        dependencies: packageDependencies,
        context,
        yamlTarget
      });
      deploymentProject.isDirty = true;
    } else {
      console.warn(`No deployer found for type: ${type}`);
      return;
    }
  } catch (error) {
    // Add error handling for require failures or execution errors
    console.error(`Error during deployment for type "${type}":`, error);
    // Re-throw the error or handle it as appropriate for your application
    throw error;
  }
};