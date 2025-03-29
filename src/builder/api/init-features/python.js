export default async function initPythonFeature(apiContext) {
  const { atom, context, setProgress } = apiContext;
  setProgress('Initializing features...');

  atom.doc.features = atom.doc.features || {};
  const features = atom.doc.features;

  // CLI PROPS
  if (features.cli === false) {
    features.cli = {
      enabled: false
    }
  } else if (features.cli === true) {
    features.cli = {
      enabled: true,
    }
  } else features.cli = {
    enabled: true
  };

  features.cli.enabled = features.cli.enabled === true && (atom.doc.features.form_enabled === false || features.cli.extend === true || features.cli.enabled === true);
}