import cloneDeep from 'lodash.clonedeep';

import initModules from '../common/init-modules.js';
import initCommonResolve from '../common/init-common-resolve.js';

async function hits({ node }) {
  return node.definition.hasOwnProperty('for');
}

async function init({ node, initNode }) {

  node.type = "for";

  await initModules({ node, initNode, extra: false });

  node.blockAutoJumpToParent = true;
  node.blockAutoJumpToSibling = false;

  // No steps property
  if (!node.definition.for.hasOwnProperty('steps')) {
    // Extract reserved properties using destructuring
    const { as, in: inValue, ...child } = node.definition.for;
    // Create self object with only the reserved properties
    const self = {};
    if (as !== undefined) self.as = as;
    if (inValue !== undefined) self.in = inValue;

    node.definition.for = self;
    node.definition.for.steps = [
      {
        [`${node.name}_step`]: child
      }
    ];
  }

  if (!Array.isArray(node.definition.for.steps)) {
    node.definition.for.steps = [
      {
        [`${node.name}_step`]: node.definition.for.steps
      }
    ];
  }

  for (let i = 0; i < node.definition.for.steps.length; i++) {

    const temp = node.definition.for.steps[i];
    const key = Object.keys(temp)[0];

    const childNode = {
      name: key,
      childs: [],
      parent: node,
      definition: temp[key],
      index: node.childs.length,
      context: {}
    }

    node.childs.push(childNode);

    await initNode({ node: childNode });
  }

  node.resolve = resolve;
}

async function resolve({ node, resolveTypeCommon, resolveNextBlock, transformExpression }) {
  node.context.transform = node.context.transform || cloneDeep(node.definition);
  const transform = node.context.transform;

  transform.for.in = await transformExpression(node.definition.for.in);

  await initCommonResolve({ node, transformExpression });

  await resolveTypeCommon({ node });

  resolveNextBlock({ node });
}

export default {
  hits,
  init,
  resolve
};