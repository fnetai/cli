import cloneDeep from 'lodash.clonedeep';

async function hits({ node }) {
  return node.definition.hasOwnProperty('signal');
}

async function init({ node, initNode }) {
  node.type = "signal";

  node.resolve = resolve;
}

async function resolve({ node, resolveTypeCommon, resolveNextBlock, transformExpression, transformValue }) {
  node.context.transform = node.context.transform || cloneDeep(node.definition);

  await resolveTypeCommon({ node });

  resolveNextBlock({ node });
}

export default {
  hits,
  init,
  resolve
};