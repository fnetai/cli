const featureTemplate = require('./feature-template');

module.exports = (apiContext) => {

  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  featureTemplate({
    feature: {
      name: "json",
      packages: [["@rollup/plugin-json", "^6"]],
    }, features, packageDevDependencies
  });
};