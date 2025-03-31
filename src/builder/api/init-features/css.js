import featureTemplate from './feature-template.js';

export default function initCssFeature(apiContext) {

  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  const cssEnabled = features.css && features.css.enabled !== false;

  let packages = [];

  if (cssEnabled) {
    packages.push(["rollup-plugin-postcss", "^4"]);
    packages.push(["sass", "^1.66"]);
    const plugins = features.css?.options?.plugins || [];
    plugins.forEach(plugin => {
      switch (plugin.name) {
        case 'postcss-import':
          packages.push(["postcss-import", "^15"]);
          break;
        case 'postcss-url':
          packages.push(["postcss-url", "^10"]);
          break;
        case 'postcss-preset-env':
          packages.push(["postcss-preset-env", "^9"]);
          break;
        case 'autoprefixer':
          packages.push(["autoprefixer", "^10"]);
          break;
        case 'cssnano':
          packages.push(["cssnano", "^6"]);
          break;
      }
    });
  }
  
  featureTemplate({
    feature: {
      name: "css",
      packages: packages,
    }, features, packageDevDependencies
  });
};