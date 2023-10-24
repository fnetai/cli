const fnetToNextJs = require('@flownet/lib-to-nextjs');
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

    if (onProgress) await onProgress({ message: "Deploying it as nextjs package." });


    const deployerTargetDefault = {
        name: "nextjs-app",
        version: "0.1.0",
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
        renderDir: path.resolve(projectDir, 'nextjs')
    }

    const result = await fnetToNextJs(args);

    return {
        deployer: result,
    };
}