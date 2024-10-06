const featureTemplate = require('./feature-template');

module.exports = (apiContext) => {

  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  featureTemplate({
    feature: {
      name: "string",
      packages: [["rollup-plugin-string", "^3"]],
    }, features, packageDevDependencies
  });
};