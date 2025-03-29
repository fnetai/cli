import merge from 'lodash.merge';

export default function featureTemplate({ feature, features, packageDevDependencies }) {

  const { name, packages, options, extraCheck, explicit } = feature;

  const keyEnabled = `${name}_enabled`;

  const rollup_output = features.rollup_output || {};

  const allKeys = Object.keys(rollup_output);

  let initialOptions = options || {};

  const featureOptions = features[name]?.options;

  if (featureOptions) initialOptions = merge(initialOptions, featureOptions);

  const globallyDisabled = !features[name] || features[name]?.enabled === false;

  allKeys.forEach(key => {
    const output = features.rollup_output[key];

    if (!output) return;

    // Output has the feature
    if (Reflect.has(output, name)) {
      if (globallyDisabled || !output[name] || output[name]?.enabled === false) {
        delete output[name];
        return;
      };

      if (output[name] === true) {
        output[name] = {
          enabled: true,
          options: initialOptions
        };
      }
    } else {
      // Output hasn't the feature
      if (!globallyDisabled && !explicit && features[keyEnabled] !== false) {
        output[name] = {
          enabled: true,
        }
      }
      else return;
    }
    output[name] = output[name] || {};
    output[name].options = {
      ...initialOptions,
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