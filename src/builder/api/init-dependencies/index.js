const fnetListNpmVersions = require('@fnet/npm-list-versions');

module.exports = async ({ atom, packageDependencies, packageDevDependencies, setProgress }) => {

  setProgress('Initializing dependencies');

  const userDependencies = atom.doc.dependencies || [];
  userDependencies.filter(w => !w.dev).forEach(dep => packageDependencies.push(dep));
  userDependencies.filter(w => w.dev).forEach(dep => packageDevDependencies.push(dep));

  if (atom.type === 'workflow') {
    packageDependencies.push({ package: "get-value", version: "^3" });
    packageDependencies.push({ package: "set-value", version: "^4" });
  }

  if (atom.doc.features.form_enabled) {
    if (atom.doc.features.dependency_auto_enabled) {
      let reactVersion = '^18.2';
      setProgress('Fetching React versions');
      const versions = await fnetListNpmVersions({ name: "react", groupBy: { major: true } });
      const found = versions.find(w => w[0] === atom.doc.features.react_version.toString());
      reactVersion = `^${found[0]}`;
      packageDependencies.push({ package: "react", version: reactVersion });
      packageDependencies.push({ package: "react-dom", version: reactVersion });

      if (atom.type === 'workflow') {
        packageDependencies.push({ package: "@flownet/react-app", version: "^0.1" });
        packageDependencies.push({ package: "@flownet/react-app-state", version: "^0.1" });
      }
    }
  }

  if (atom.doc.features.preact_enabled) {
    packageDependencies.push({ package: "preact", version: "^10" });
  }

  if (atom.doc.features.cli.enabled === true) {
    packageDependencies.push({ package: "@fnet/args", version: "^0.1" });
    packageDevDependencies.push({ package: "ajv", version: "^8" });

    if (atom.doc.features.cli.fargs && atom.doc.features.cli.fargs?.enabled !== false) {
      packageDependencies.push({ package: "@fnet/config", version: "0.2.21" });
    }
  }

  if (atom.doc.features.render && atom.doc.features.render.enabled !== false) {
    packageDevDependencies.push({ package: "@flownet/lib-render-templates-dir", version: "0.1.19" });
  }

  // DEV DEPENDENCIES
  packageDevDependencies.push({ package: "@babel/core", version: "^7" });
  packageDevDependencies.push({ package: "@rollup/plugin-commonjs", version: "^28" });
  packageDevDependencies.push({ package: "@rollup/plugin-node-resolve", version: "^16" });
  packageDevDependencies.push({ package: "@rollup/plugin-replace", version: "^6" });
  packageDevDependencies.push({ package: "rollup", version: "^4" });
  if (atom.doc.features.dts_enabled) {
    packageDevDependencies.push({ package: "rollup-plugin-dts", version: "^6" });
  }
  packageDevDependencies.push({ package: "rollup-plugin-peer-deps-external", version: "^2" });
  packageDevDependencies.push({ package: "@rollup/plugin-alias", version: "^5" });
  packageDevDependencies.push({ package: "fs-extra", version: "^11" });

  if (atom.doc.features.babel_enabled) {
    packageDevDependencies.push({ package: "@rollup/plugin-babel", version: "^6" });
    packageDevDependencies.push({ package: "@babel/preset-env", version: "^7" });
    packageDevDependencies.push({ package: "@babel/preset-react", version: "^7" });

    atom.doc.features.babel?.options?.plugins?.forEach(plugin => {
      const pluginName = plugin[0];
      switch (pluginName) {
        case '@babel/plugin-proposal-decorators':
          packageDevDependencies.push({ package: "@babel/plugin-proposal-decorators", version: "^7" });
          break;
        case '@babel/plugin-proposal-class-properties':
          packageDevDependencies.push({ package: "@babel/plugin-proposal-class-properties", version: "^7" });
          break;
        case '@babel/plugin-proposal-private-methods':
          packageDevDependencies.push({ package: "@babel/plugin-proposal-private-methods", version: "^7" });
          break;
        case '@babel/plugin-proposal-private-property-in-object':
          packageDevDependencies.push({ package: "@babel/plugin-proposal-private-property-in-object", version: "^7" });
          break;
        case '@babel/plugin-proposal-optional-chaining':
          packageDevDependencies.push({ package: "@babel/plugin-proposal-optional-chaining", version: "^7" });
          break;
      }
    });
  }

  packageDevDependencies.push({ package: "@fnet/rollup-plugin-delete", version: "0.1.10" });

  if (atom.doc.features.browsersync_enabled) {
    packageDevDependencies.push({ package: "@fnet/rollup-plugin-browsersync", version: "0.1.11" });
  }
}