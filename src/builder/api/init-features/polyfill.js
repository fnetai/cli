const featureTemplate = require('./feature-template');

module.exports = (apiContext) => {

  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  featureTemplate({
    feature: {
      name: "polyfill",
      packages: [["rollup-plugin-node-polyfills", "^0.2"]],
    }, features, packageDevDependencies
  });
};