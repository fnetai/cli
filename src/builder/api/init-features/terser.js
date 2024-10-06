const featureTemplate = require('./feature-template');

module.exports = (apiContext) => {

  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  featureTemplate({
    feature: {
      name: "terser",
      packages: [["@rollup/plugin-terser", "^0.4"]],
    }, features, packageDevDependencies
  });
};