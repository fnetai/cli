import featureTemplate from './feature-template';

export default function initImageFeature(apiContext) {

  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  featureTemplate({
    feature: {
      name: "image",
      packages: [["@rollup/plugin-image", "^3"]],
    }, features, packageDevDependencies
  });
};