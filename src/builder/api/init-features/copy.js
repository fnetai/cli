import featureTemplate from './feature-template.js';

export default function initCopyFeature(apiContext) {

  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  if(features.runtime.type === 'bun') return;
  
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

  featureTemplate({
    feature: {
      name: "copy",
      packages: [["rollup-plugin-copy", "^3"], ["chokidar", "^3"]],
      options
      // extraCheck
    }, features, packageDevDependencies
  });
};