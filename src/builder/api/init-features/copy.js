const featureTemplate = require('./feature-template');

module.exports = (apiContext) => {

  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  const options = {};

  // TODO: remove it later
  // app specific
  if (features.app?.enabled === true) {
    options.targets = options.targets || [];
    options.targets.push({ src: "./src/app/index.html", dest: features.app.dir });
    if (!Reflect.has(features.app, "copy")) {
      if (!Reflect.has(features, "copy")) {
        features.copy = true;
      }
    }
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