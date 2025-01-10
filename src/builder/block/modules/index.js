const cloneDeep = require('lodash.clonedeep');
const initModules = require('../common/init-modules');

async function hits({ node }) {
  return node.definition.hasOwnProperty('modules');
}

async function init({ node, initNode }) {
  node.type = "modules"

  await initModules({ node, initNode });

  node.resolve = resolve;
}

async function resolve({ node, resolveTypeCommon, resolveNextBlock, transformExpression }) {

  node.context.transform = node.context.transform || cloneDeep(node.definition);
  const transform = node.context.transform;

  if (transform.export)
    transform.export = await transformExpression(transform.export);

  if (Reflect.has(transform, 'return')) {
    node.returns = true;
    transform.return = await transformExpression(transform.return);
  }
  
  await resolveTypeCommon({ node });

  resolveNextBlock({ node });
}

module.exports = {
  hits,
  init,
  resolve
}