const merge = require('lodash.merge');

module.exports = ({ feature, features, packageDevDependencies }) => {

  const { name, packages, options, extraCheck } = feature;

  const keyEnabled = `${name}_enabled`;

  const rollup_output = features.rollup_output || {};

  const allKeys = Object.keys(rollup_output);

  let defaultOptions = options || {};

  const featureOptions= features[name]?.options;

  if(featureOptions) 
    defaultOptions = merge(defaultOptions, featureOptions);

  allKeys.forEach(key => {
    const output = features.rollup_output[key];

    if (!output) return;

    // Output has the feature
    if (Reflect.has(output, name)) {
      if (!output[name] || output[name]?.enabled === false) {
        delete output[name];
        return;
      };

      if (output[name] === true) {
        output[name] = {
          enabled: true,
          options: defaultOptions
        };
      }
    } else {
      // Output hasn't the feature
      if (features[name] && features[keyEnabled] !== false) {
        output[name] = {
          enabled: true,
        }
      }
      else return;
    }
    output[name] = output[name] || {};
    output[name].options = {
      ...defaultOptions,
      ...output[name].options
    };
  });

  let exists = allKeys.some(w => features.rollup_output[w][name]?.enabled === true);

  if (extraCheck) exists = extraCheck() && exists;

  features[keyEnabled] = exists;

  if (exists) {
    packages.forEach(p => packageDevDependencies.push({ package: p[0], version: p[1] }));
  }
};