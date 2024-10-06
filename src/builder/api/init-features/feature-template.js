module.exports = ({ feature, features, packageDevDependencies }) => {

  const { name, packages, options } = feature;

  const keyEnabled = `${name}_enabled`;

  const rollup_output = features.rollup_output || {};

  const allKeys = Object.keys(rollup_output);

  const defaultOptions = options || {};

  allKeys.forEach(key => {
    const output = features.rollup_output[key];

    if (!output?.[name] || output?.[name]?.enabled === false) {
      delete output[name];
      return;
    };

    if (output[name] === true) {
      output[name] = {
        enabled: true,
        options: defaultOptions
      };
    }

    output[name].options = output[name].options || {};
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