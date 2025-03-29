import featureTemplate from './feature-template';

export default function initVisualizerFeature(apiContext) {

  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  featureTemplate({
    feature: {
      name: "visualizer",
      packages: [["rollup-plugin-visualizer", "^5"]],
      expilicit: true,
    }, features, packageDevDependencies
  });
};