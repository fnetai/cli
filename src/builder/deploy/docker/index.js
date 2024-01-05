const fnetDeployer = require('@flownet/lib-to-docker');
const cloneDeep = require("lodash.clonedeep");
const merge = require('lodash.merge');
const semver = require('semver');
const path = require('node:path');

module.exports = async ({
    atom,
    target,
    onProgress,
    projectDir,
    dependencies
}) => {

    const deployerName='docker';

    if (onProgress) await onProgress({ message: `Deploying it as ${deployerName} package.` });

    const deployerTargetDefault = {
    }

    target.params = merge(deployerTargetDefault, target.params);

    const nextVersion = semver.inc(target.params.version, "patch");
    target.params.version = nextVersion;

    const deployerTarget = cloneDeep(target);

    deployerTarget.params.dependencies = cloneDeep(dependencies);

    const args = {
        atom,
        target: deployerTarget.params,
        projectDir,
        renderDir: path.resolve(projectDir, 'docker')
    }
    
    const result = await fnetDeployer(args);

    return {
        deployer: result,
    };
}