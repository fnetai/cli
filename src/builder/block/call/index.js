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

  let targetLib = transform.from || transform.import || transform.call;

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
      // transform.call = await transformExpression(transform.call);
    }
    else if (Reflect.has(transform, 'call')) {
      // origin is 'call'
      transform.call = await transformExpression(node.target.atom.name);
      targetLib = transform.call;
    }
  }
  else {
    if (Reflect.has(transform, 'from') || Reflect.has(transform, 'import')) {
      if (transform.call.startsWith('use:e::')) {
        const substr = transform.call.substring(7);
        transform.libExp = await transformExpression(`e::LIBRARY.${substr}`);
      }
    };
  }

  if (transform.args)
    transform.args = await transformExpression(transform.args);

  if (transform.new)
    transform.new = await transformExpression(transform.new);

  if (transform.context)
    transform.context = await transformExpression(transform.context);

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
  }
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