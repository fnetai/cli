import cloneDeep from 'lodash.clonedeep';
import initModules from '../common/init-modules.js';
import initCommonResolve from '../common/init-common-resolve.js';

async function hits({ node }) {
  return node.definition.hasOwnProperty('output');
}

async function init({ node, initNode }) {
  node.type = "output";

  await initModules({ node, initNode });

  node.resolve = resolve;
}

async function resolve({ node, resolveTypeCommon, resolveNextBlock, transformExpression }) {
  node.context.transform = node.context.transform || cloneDeep(node.definition);

  await initCommonResolve({ node, transformExpression });

  await resolveTypeCommon({ node });

  resolveNextBlock({ node });
}

export default {
  hits,
  init,
  resolve
};