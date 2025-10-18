import cloneDeep from 'lodash.clonedeep';
import initCommonResolve from '../common/init-common-resolve.js';

async function hits({ node }) {
  return node.definition.hasOwnProperty('parallel');
}

async function init({ node, initNode }) {
  node.type = 'parallel';

  // Parallel children should not auto-jump to siblings or parent
  // They execute concurrently and independently
  node.blockAutoJumpToParent = true;   // Disable jump to parent
  node.blockAutoJumpToSibling = true;  // Disable jump to sibling

  const parallel = node.definition.parallel || [];

  for await (const step of parallel) {
    const key = Object.keys(step)[0];
    const childNode = {
      name: key,
      childs: [],
      parent: node,
      definition: step[key],
      index: node.childs.length,
      context: {}
    }

    node.childs.push(childNode);

    await initNode({ node: childNode });
  }

  node.resolve = resolve;
}

async function resolve({ node, transformExpression, resolveNextBlock }) {
  // Parallel steps don't have a single "next" child
  // They all execute concurrently

  node.context.transform = node.context.transform || cloneDeep(node.definition);

  await initCommonResolve({ node, transformExpression });

  // Resolve next block after parallel execution completes
  resolveNextBlock({ node });
}

export default {
  hits,
  init,
  resolve
};