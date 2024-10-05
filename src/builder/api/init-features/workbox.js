module.exports = ({ features, packageDevDependencies }) => {

  const rollup_output = features.rollup_output || {};

  const allKeys = Object.keys(rollup_output);

  // default global option
  const defaultOptions = features.workbox?.options;

  // iterate over output targets
  allKeys.forEach(key => {
    const output = features.rollup_output[key];

    // remove workbox if not enabled
    if (!output?.workbox || output?.workbox?.enabled === false) {
      delete output.workbox;
      return;
    };

    if (output.workbox === true) {
      if (!defaultOptions) {
        delete output.workbox;
        return;
      }

      output.workbox = {
        enabled: true,
        options: defaultOptions
      };
    }

    output.workbox.options = output.workbox.options || defaultOptions
  });

  const exists = allKeys.some(w => features.rollup_output[w].workbox?.enabled === true);

  features.workbox_enabled = exists;

  // add plugin package
  if (features.workbox_enabled) {
    packageDevDependencies.push({ package: "rollup-plugin-workbox", version: "^8" });
  }
}