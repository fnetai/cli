import featureTemplate from './feature-template';

export default function initNunjucksFeature(apiContext) {

  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  featureTemplate({
    feature: {
      name: "nunjucks",
      packages: [["@fnet/rollup-plugin-nunjucks", "0.1.8"]],
    }, features, packageDevDependencies
  });
};