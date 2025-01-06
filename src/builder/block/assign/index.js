const cloneDeep = require('lodash.clonedeep');
const initModules= require('../common/init-modules');

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