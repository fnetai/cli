import featureTemplate from './feature-template.js';

export default function initWasmFeature(apiContext) {

  const { atom, packageDevDependencies } = apiContext;
  const features = atom.doc.features;

  featureTemplate({
    feature: {
      name: "wasm",
      packages: [["@rollup/plugin-wasm", "^6"]],
    }, features, packageDevDependencies
  });
};