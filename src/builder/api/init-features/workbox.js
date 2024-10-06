const featureTemplate = require('./feature-template');

module.exports = (apiContext) => {

  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  featureTemplate({
    feature: {
      name: "workbox",
      packages: [["rollup-plugin-workbox", "^8"]],
      options: {
        generate: {
          swDest: 'dist/app/esm/sw.js',
          globDirectory: 'dist/app/esm',
          globPatterns: ['**/*.{html,js,css,png,jpg}'],
          skipWaiting: true,
          clientsClaim: true
        }
      }
    }, features, packageDevDependencies
  });
};