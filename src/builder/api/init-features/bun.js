export default async function initFeaturesBun({ atom, setProgress }) {
  await setProgress({ message: "Initializing features..." });

  atom.doc.features = atom.doc.features || {};

  // Project features
  atom.doc.features.project = atom.doc.features.project || {};
  atom.doc.features.project.format = atom.doc.features.project.format || "esm";

  // CLI features
  atom.doc.features.cli = atom.doc.features.cli || {};
  atom.doc.features.cli.enabled = atom.doc.features.cli.enabled !== false;
  atom.doc.features.cli.dir = atom.doc.features.cli.dir || "./dist/cli/esm";
  atom.doc.features.cli.node_options = atom.doc.features.cli.node_options || "";

  // App features
  atom.doc.features.app = atom.doc.features.app || {};
  atom.doc.features.app.enabled = atom.doc.features.app.enabled !== false;
  atom.doc.features.app.dir = atom.doc.features.app.dir || "./dist/app/esm";
  atom.doc.features.app.html = atom.doc.features.app.html !== false;

  // Runtime features
  atom.doc.features.runtime = atom.doc.features.runtime || {};
  atom.doc.features.runtime.type = "bun";
  atom.doc.features.runtime.template = "bun";
}
