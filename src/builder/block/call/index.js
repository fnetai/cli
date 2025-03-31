import cloneDeep from 'lodash.clonedeep';
import initModules from '../common/init-modules.js';
import initCommonResolve from '../common/init-common-resolve.js';

async function hits({ node }) {
  return node.definition.hasOwnProperty('call');
}

async function init({ node, initNode }) {
  node.type = "call"

  await initModules({ node, initNode });

  node.resolve = resolve;
}

async function resolve({ node, resolveTypeCommon, resolveNextBlock, transformExpression }) {

  node.context.transform = node.context.transform || cloneDeep(node.definition);
  const transform = node.context.transform;

  if (node.target?.atom?.doc?.type === 'function') {
    transform.call = await transformExpression(node.target.atom.name);
  }

  if (transform.args)
    transform.args = await transformExpression(transform.args);

  if (transform.result) {
    if (typeof transform.result === 'string') {
      transform.result = [{ [transform.result]: "e::result" }];
    }

    for (let i = 0; i < transform.result?.length; i++) {
      let assign = transform.result[i];
      let assignKey = Object.keys(assign)[0];
      let assingValue = assign[assignKey];

      let assignTransform = {
        key: await transformExpression(assignKey),
        value: await transformExpression(assingValue)
      }

      transform.result[i] = assignTransform;
    }

    // transform.result = await transformExpression(transform.result);
  }
  const root = node.workflow.parent;

  if (transform.import)
    node.context.lib = root.context.libs.find(w => w.name === transform.import);
  else
    node.context.lib = root.context.libs.find(w => w.name === transform.call);

  await initCommonResolve({ node, transformExpression });

  await resolveTypeCommon({ node });

  resolveNextBlock({ node });
}

export default{
  hits,
  init,
  resolve
};