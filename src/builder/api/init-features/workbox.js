module.exports = (apiContext) => {

  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;


  const rollup_output = features.rollup_output || {};

  const allKeys = Object.keys(rollup_output);

  // Define default options for both worker (generateSW) and manifest (injectManifest)
  const defaultOptions = {
    generate: {
      swDest: 'dist/app/esm/sw.js',
      globDirectory: 'dist/app/esm',
      globPatterns: ['**/*.{html,js,css,png,jpg}'],
      skipWaiting: true,
      clientsClaim: true
    }
  };

  // Iterate over output targets
  allKeys.forEach(key => {
    const output = features.rollup_output[key];

    // Remove workbox if not enabled
    if (!output?.workbox || output?.workbox?.enabled === false) {
      delete output.workbox;
      return;
    };

    // If workbox is enabled and no specific options are provided, use default options
    if (output.workbox === true) {
      if (!defaultOptions) {
        delete output.workbox;
        return;
      }

      // Set default generate options if not provided
      output.workbox = {
        enabled: true,
        options: {
          generate: defaultOptions.generate,
        }
      };
    }

    // Ensure options are set if workbox is enabled and allow for customization
    output.workbox.options = output.workbox.options || {};
    output.workbox.options.generate = output.workbox.options.generate || defaultOptions.generate;
  });
  
  // Check if any workbox is enabled across all outputs
  const exists = allKeys.some(w => features.rollup_output[w].workbox?.enabled === true);

  features.workbox_enabled = exists;

  // Add the rollup-plugin-workbox to dev dependencies if workbox is enabled
  if (features.workbox_enabled) {
    packageDevDependencies.push({ package: "rollup-plugin-workbox", version: "^8" });
  }
};