import cloneDeep from 'lodash.clonedeep';
import initCommonResolve from '../common/init-common-resolve';

async function hits({ node }) {
  return node.definition.hasOwnProperty('steps');
}

async function init({ node, initNode }) {
  if (!node.type) node.type = 'steps';

  const steps = node.definition.steps || [];
  
  for await (const step of steps) {
    const key = Object.keys(step)[0];
    const childNode = {
      name: key,
      childs: [],
      parent: node,
      definition: step[key],
      index: node.childs.length,
      context: {
      }
    }

    node.childs.push(childNode);

    await initNode({ node: childNode });
  }

  node.resolve = resolve;
}

async function resolve({ node, transformExpression }) {
  node.context.next = node.childs[0];

  node.context.transform = node.context.transform || cloneDeep(node.definition);

  await initCommonResolve({ node, transformExpression });

}

export default {
  hits,
  init,
  resolve
};