const fnetListNpmVersions = require('@flownet/lib-list-npm-versions');

module.exports = async ({ atom, packageDependencies, packageDevDependencies }) => {

    if (atom.type === 'workflow') {
        packageDependencies.push({ package: "get-value", version: "^3.0" });
        packageDependencies.push({ package: "set-value", version: "^4.1" });
    }

    if (atom.doc.features.form_enabled) {
        if (atom.doc.features.dependency_auto_enabled) {
            let reactVersion = '^18.2';
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

    if (atom.doc.features.cli.enabled === true) {
        packageDependencies.push({ package: "yargs", version: "^17" });
    }

    packageDependencies.push({ package: "chalk", version: "^4" });

    // DEV DEPENDENCIES
    packageDevDependencies.push({ package: "@babel/core", version: "^7.23" });
    packageDevDependencies.push({ package: "@rollup/plugin-commonjs", version: "^25.0" });
    packageDevDependencies.push({ package: "@rollup/plugin-node-resolve", version: "^15.1" });
    packageDevDependencies.push({ package: "@rollup/plugin-replace", version: "^5.0" });
    packageDevDependencies.push({ package: "rollup", version: "^3.26" });
    packageDevDependencies.push({ package: "rollup-plugin-delete", version: "^2.0" });
    packageDevDependencies.push({ package: "rollup-plugin-dts", version: "^6.0" });
    packageDevDependencies.push({ package: "rollup-plugin-peer-deps-external", version: "^2.2" });
    packageDevDependencies.push({ package: "@rollup/plugin-alias", version: "^5.0" });

    if (atom.doc.features.babel_enabled) {
        packageDevDependencies.push({ package: "@rollup/plugin-babel", version: "^6.0" });
        packageDevDependencies.push({ package: "@babel/preset-env", version: "7.22" });
        packageDevDependencies.push({ package: "@babel/preset-react", version: "7.22" });
    }

    if (atom.doc.features.browsersync_enabled) {
        packageDevDependencies.push({ package: "rollup-plugin-browsersync", version: "^1.3" });
    }

    if (atom.doc.features.json_enabled) {
        packageDevDependencies.push({ package: "@rollup/plugin-json", version: "^6.0" });
    }

    if (atom.doc.features.terser_enabled) {
        packageDevDependencies.push({ package: "@rollup/plugin-terser", version: "^0.4" });
    }

    if (atom.doc.features.wasm_enabled) {
        packageDevDependencies.push({ package: "@rollup/plugin-wasm", version: "^6.1" });
    }

    if (atom.doc.features.image_enabled) {
        packageDevDependencies.push({ package: "@rollup/plugin-image", version: "^3.0" });
    }

    if (atom.doc.features.analyzer_enabled) {
        packageDevDependencies.push({ package: "rollup-plugin-analyzer", version: "^3.3" });
    }

    if (atom.doc.features.visualizer_enabled) {
        packageDevDependencies.push({ package: "rollup-plugin-visualizer", version: "^5.9" });
    }

    if (atom.doc.features.string_enabled) {
        packageDevDependencies.push({ package: "rollup-plugin-string", version: "^3.0" });
    }
    
    if (atom.doc.features.css_enabled) {
        packageDevDependencies.push({ package: "rollup-plugin-postcss", version: "4.0" });
        packageDevDependencies.push({ package: "sass", version: "^1.66" });

        const plugins = atom.doc.features.css_options?.plugins || [];
        plugins.forEach(plugin => {
            switch (plugin.name) {
                case 'postcss-import':
                    packageDevDependencies.push({ package: "postcss-import", version: "^15.1" });
                    break;
                case 'postcss-url':
                    packageDevDependencies.push({ package: "postcss-url", version: "^10.1" });
                    break;
                case 'postcss-preset-env':
                    packageDevDependencies.push({ package: "postcss-preset-env", version: "^9.1" });
                    break;
                case 'autoprefixer':
                    packageDevDependencies.push({ package: "autoprefixer", version: "^10.4" });
                    break;
                case 'cssnano':
                    packageDevDependencies.push({ package: "cssnano", version: "^6.0" });
                    break;
            }
        });
    }

    if (atom.doc.features.copy_enabled) {
        packageDevDependencies.push({ package: "rollup-plugin-copy", version: "^3.5" });
    }
}