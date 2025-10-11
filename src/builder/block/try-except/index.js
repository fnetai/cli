import cloneDeep from 'lodash.clonedeep';
import initModules from '../common/init-modules.js';
import initCommonResolve from '../common/init-common-resolve.js';

async function hits({ node }) {
  return node.definition.hasOwnProperty('try') && node.definition.hasOwnProperty('except');
}

async function init({ node, initNode }) {
  node.type = "tryexcept";

  await initModules({ node, initNode ,extra: false });

  node.blockAutoJumpToParent = false;
  node.blockAutoJumpToSibling = true;

  // try
  if (node.definition.try) {
    const key = "try";
    const childNode = {
      name: key,
      childs: [],
      parent: node,
      definition: node.definition[key],
      index: node.childs.length,
      context: {}
    }
    node.childs.push(childNode);
    await initNode({ node: childNode });
  }

  // except
  if (node.definition.except) {
    const key = "except";
    const childNode = {
      name: key,
      childs: [],
      parent: node,
      definition: node.definition[key],
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

  node.context.try = node.childs.find(w => w.name === 'try');
  node.context.except = node.childs.find(w => w.name === 'except');

  if (node.context.except) {
    const child = node.context.except;
    child.context.transform = child.context.transform || cloneDeep(child.definition);
    if (!child.context.transform.hasOwnProperty('as')) child.context.transform.as = 'error';
  }

  await initCommonResolve({ node, transformExpression });

  await resolveTypeCommon({ node });

  resolveNextBlock({ node });
}

export default {
  hits,
  init,
  resolve
};
