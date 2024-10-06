const featureTemplate = require('./feature-template');

module.exports = (apiContext) => {

  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  featureTemplate({
    feature: {
      name: "wasm",
      packages: [["@rollup/plugin-wasm", "^6"]],
    }, features, packageDevDependencies
  });
};