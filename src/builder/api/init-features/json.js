import featureTemplate from './feature-template.js';

export default function initJsonFeature(apiContext) {

  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  if(features.runtime.type === 'bun') return;

  featureTemplate({
    feature: {
      name: "json",
      packages: [["@rollup/plugin-json", "^6"]],
    }, features, packageDevDependencies
  });
};