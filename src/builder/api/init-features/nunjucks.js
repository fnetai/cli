const featureTemplate = require('./feature-template');

module.exports = (apiContext) => {

  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  featureTemplate({
    feature: {
      name: "nunjucks",
      packages: [["@fnet/rollup-plugin-nunjucks", "0.1.3"]],
    }, features, packageDevDependencies
  });
};