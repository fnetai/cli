const featureTemplate = require('./feature-template');

module.exports = (apiContext) => {

  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  featureTemplate({
    feature: {
      name: "gzip",
      packages: [["rollup-plugin-gzip", "^4"]],
      explicit: true
    }, features, packageDevDependencies
  });
};