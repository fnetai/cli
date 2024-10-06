const featureTemplate = require('./feature-template');

module.exports = (apiContext) => {

  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  featureTemplate({
    feature: {
      name: "visualizer",
      packages: [["rollup-plugin-visualizer", "^5"]],
    }, features, packageDevDependencies
  });
};