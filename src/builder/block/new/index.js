import cloneDeep from 'lodash.clonedeep';
import initModules from '../common/init-modules.js';
import initCommonResolve from '../common/init-common-resolve.js';

async function hits({ node }) {
  return node.definition.hasOwnProperty('new');
}

async function init({ node, initNode }) {
  node.type = "new"

  await initModules({ node, initNode });

  node.resolve = resolve;
}

async function resolve({ node, resolveTypeCommon, resolveNextBlock, transformExpression }) {

  node.context.transform = node.context.transform || cloneDeep(node.definition);
  const transform = node.context.transform;

  let targetLib = transform.from || transform.import;

  if (node.target?.atom?.doc?.type === 'function') {
    if (Reflect.has(transform, 'from')) {
      // origin is 'from'
      targetLib = transform.from;
      transform.from = await transformExpression(node.target.atom.name);
    }
    else if (Reflect.has(transform, 'import')) {
      // origin is 'import'
      targetLib = transform.import;
      transform.import = await transformExpression(node.target.atom.name);
    }
  }

  if (transform.args)
    transform.args = await transformExpression(transform.args);

  if (transform.new)
    transform.new = await transformExpression(transform.new);

  const root = node.workflow.parent;

  node.context.lib = root.context.libs.find(w => w.name === targetLib);

  await initCommonResolve({ node, transformExpression });

  await resolveTypeCommon({ node });

  resolveNextBlock({ node });
}

export default {
  hits,
  init,
  resolve
};