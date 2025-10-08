import fnetListNpmVersions from '@fnet/npm-list-versions';

export default async function initDependenciesBun({ atom, packageDependencies, packageDevDependencies, setProgress }) {

  setProgress('Initializing dependencies for Bun');

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
        packageDependencies.push({ package: "@fnet/react-app", version: "^0.1" });
        packageDependencies.push({ package: "@fnet/react-app-state", version: "^0.1" });
      }
    }
  }

  if (atom.doc.features.preact_enabled) {
    packageDependencies.push({ package: "preact", version: "^10" });
  }

  if (atom.doc.features.cli.enabled === true) {
    packageDependencies.push({ package: "@fnet/args", version: "^0.1" });
    packageDependencies.push({ package: "yargs-parser", version: "^22.0" });
    // packageDevDependencies.push({ package: "ajv", version: "^8" });

    if (atom.doc.features.cli.fargs && atom.doc.features.cli.fargs?.enabled !== false) {
      packageDependencies.push({ package: "@fnet/config", version: "0.2.21" });
    }

    // Add MCP dependencies if MCP mode is enabled
    if (atom.doc.features.cli.mcp && atom.doc.features.cli.mcp.enabled === true) {
      packageDependencies.push({ package: "@modelcontextprotocol/sdk", version: "^1.10" });
      packageDependencies.push({ package: "express", version: "^4.18" });
    }

    // HTTP mode uses Node.js built-in http module, no additional dependencies needed
  }

  if (atom.doc.features.render && atom.doc.features.render.enabled !== false) {
    packageDevDependencies.push({ package: "@flownet/lib-render-templates-dir", version: "0.1.19" });
  }
}