import featureTemplate from './feature-template.js';

export default function initTerserFeature(apiContext) {

  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  featureTemplate({
    feature: {
      name: "terser",
      packages: [["@rollup/plugin-terser", "^0.4"]],
    }, features, packageDevDependencies
  });
};