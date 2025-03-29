module.exports = async (apiContext) => {

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
      await (await import('../atom')).default({ ...apiContext });
    } else if (type === "red") {
      await (await import('../red')).default({ ...apiContext });
    } else if (type === "npm") {
      await (await import('../npm')).default({ ...apiContext });
    } else if (type === "gcs") {
      await (await import('../gcs')).default({ ...apiContext });
    } else if (type === "gitlab") {
      await (await import('../gitlab')).default({ ...apiContext });
    } else if (type === "fnet-package") {
      await (await import('../fnet-package')).default({ ...apiContext });
    } else if (type === "fnet-form") {
      await (await import('../fnet-form')).default({ ...apiContext });
    } else if (type === "fnet-node") {
      await (await import('../fnet-node')).default({ ...apiContext });
    } else if (type === "fnet-flow") {
      await (await import('../fnet-flow')).default({ ...apiContext });
    }
    // Handle the second set of deployment types
    else if (type === 'nextjs') {
      await (await import('../nextjs')).default({
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
      await (await import('../webos')).default({
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
      await (await import('../electron')).default({
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
      await (await import('../docker')).default({
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
      await (await import('../ios-app')).default({
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
      await (await import('../macos-app')).default({
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
      await (await import('../rust')).default({
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
      await (await import('../pypi')).default({
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