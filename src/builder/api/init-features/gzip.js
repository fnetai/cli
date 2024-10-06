module.exports = (apiContext) => {

  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  const rollup_output = features.rollup_output || {};

  const allKeys = Object.keys(rollup_output);

  // Define default options for gzip compression
  const defaultOptions = {
    // filter: /\.(js|css|html|svg)$/, // Files to compress
    // threshold: 10240, // Min file size for compression (10KB)
    // deleteOriginalAssets: false // Keep original files
  };

  // Iterate over output targets
  allKeys.forEach(key => {
    const output = features.rollup_output[key];

    // If gzip is not enabled, remove it from the configuration
    if (!output?.gzip || output?.gzip?.enabled === false) {
      delete output.gzip;
      return;
    };

    // If gzip is enabled and no specific options are provided, use default options
    if (output.gzip === true) {
      output.gzip = {
        enabled: true,
        options: defaultOptions
      };
    }

    // Ensure options are set if gzip is enabled and allow for customization
    output.gzip.options = output.gzip.options || {};
    output.gzip.options = {
      ...defaultOptions,
      ...output.gzip.options
    };
  });

  // Check if any gzip is enabled across all outputs
  const exists = allKeys.some(w => features.rollup_output[w].gzip?.enabled === true);

  features.gzip_enabled = exists;
  
  // Add the rollup-plugin-gzip to dev dependencies if gzip is enabled
  if (features.gzip_enabled) {
    packageDevDependencies.push({ package: "rollup-plugin-gzip", version: "^4" });
  }
};