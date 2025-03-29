import featureTemplate from './feature-template';

export default function initPolyfillFeature(apiContext) {

  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  featureTemplate({
    feature: {
      name: "polyfill",
      packages: [["rollup-plugin-node-polyfills", "^0.2"]],
    }, features, packageDevDependencies
  });
};