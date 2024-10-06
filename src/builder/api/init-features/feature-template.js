module.exports = ({ feature, features, packageDevDependencies }) => {

  const { name, packages, options } = feature;

  const keyEnabled = `${name}_enabled`;

  const rollup_output = features.rollup_output || {};

  const allKeys = Object.keys(rollup_output);

  const defaultOptions = options || {};

  allKeys.forEach(key => {
    const output = features.rollup_output[key];

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

  const exists = allKeys.some(w => features.rollup_output[w][name]?.enabled === true);

  features[keyEnabled] = exists;

  if (exists) {
    packages.forEach(p => packageDevDependencies.push({ package: p[0], version: p[1] }));
  }
};