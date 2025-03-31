import featureTemplate from './feature-template.js';

export default function initAnalyzerFeature(apiContext) {
  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  featureTemplate({
    feature: {
      name: "analyzer",
      packages: [["rollup-plugin-analyzer", "^3"]],
      options: {
        summaryOnly: true,
        limit: 12
      },
      explicit: true
    }, features, packageDevDependencies
  });
};