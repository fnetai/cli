const featureTemplate = require('./feature-template');

module.exports = (apiContext) => {
  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  featureTemplate({
    feature: {
      name: "analyzer",
      packages: [["rollup-plugin-analyzer", "^3"]],
      options: {
        summaryOnly: true,
        limit: 12
      }
    }, features, packageDevDependencies
  });
};