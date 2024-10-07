const featureTemplate = require('./feature-template');

module.exports = (apiContext) => {

  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  const options = {};

  // TODO: remove it later
  // app specific
  if (features.app_enabled) {
    options.targets = options.targets || [];
    options.targets.push({ src: "./src/app/index.html", dest: features.app.dir });
  }

  // const extraCheck = () => {
  //   return features.app_enabled;
  // }

  featureTemplate({
    feature: {
      name: "copy",
      packages: [["rollup-plugin-copy", "^3"], ["chokidar", "^3"]],
      options
      // extraCheck
    }, features, packageDevDependencies
  });
};