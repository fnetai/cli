import cloneDeep from 'lodash.clonedeep';
import initCommonResolve from '../common/init-common-resolve';

async function hits({ node }) {
  return node.definition.hasOwnProperty('next');
}

async function init({ node, initNode }) {
  node.type = "jump";

  node.resolve = resolve;
}

async function resolve({ node, resolveTypeCommon, resolveNextBlock, transformExpression }) {
  node.context.transform = node.context.transform || cloneDeep(node.definition);
  const transform = node.context.transform;

  transform.next = await transformExpression(transform.next);

  await initCommonResolve({ node, transformExpression });

  await resolveTypeCommon({ node });
  resolveNextBlock({ node });
}

export default {
  hits,
  init,
  resolve
};