import cloneDeep from 'lodash.clonedeep';
import initModules from '../common/init-modules.js';
import initCommonResolve from '../common/init-common-resolve.js';

async function hits({ node }) {
  return node.definition.hasOwnProperty('assign');
}

async function init({ node, initNode }) {
  node.type = "assign";

  await initModules({ node, initNode });

  node.resolve = resolve;
}

async function resolve({ node, resolveTypeCommon, resolveNextBlock, transformExpression }) {
  node.context.transform = node.context.transform || cloneDeep(node.definition);
  const transform = node.context.transform;

  for (let i = 0; i < transform.assign?.length; i++) {
    let assign = transform.assign[i];
    let assignKey = Object.keys(assign)[0];
    let assingValue = assign[assignKey];

    let assignTransform = {
      key: await transformExpression(assignKey),
      value: await transformExpression(assingValue)
    }

    transform.assign[i] = assignTransform;
  }

  await initCommonResolve({ node, transformExpression });

  await resolveTypeCommon({ node });
  resolveNextBlock({ node });
}

export default{
  hits,
  init,
  resolve
};