const cloneDeep = require('lodash.clonedeep');
const initModules = require('../common/init-modules');
const initCommonResolve = require('../common/init-common-resolve');

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

  await initCommonResolve({ node, transformExpression });
  
  await resolveTypeCommon({ node });

  resolveNextBlock({ node });
}

module.exports = {
  hits,
  init,
  resolve
}