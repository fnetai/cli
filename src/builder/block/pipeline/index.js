import cloneDeep from 'lodash.clonedeep';
import initCommonResolve from '../common/init-common-resolve.js';

async function hits({ node }) {
  return node.definition.hasOwnProperty('pipeline');
}

async function init({ node }) {
  node.type = 'pipeline';

  // Get binary name
  const binaryName = node.definition.pipeline;

  if (!binaryName || typeof binaryName !== 'string') {
    throw new Error(`Pipeline step '${node.indexKey}' requires a binary name`);
  }

  node.definition.binaryName = binaryName;

  node.resolve = resolve;
}

async function resolve({ node, transformExpression, resolveNextBlock }) {
  node.context.transform = node.context.transform || cloneDeep(node.definition);
  const transform = node.context.transform;

  // Transform input expression
  if (transform.input) {
    transform.input = await transformExpression(transform.input);
  }

  // Transform args if provided
  if (transform.args) {
    transform.args = await transformExpression(transform.args);
  }

  // Transform env if provided
  if (transform.env) {
    transform.env = await transformExpression(transform.env);
  }

  // Transform cwd if provided
  if (transform.cwd) {
    transform.cwd = await transformExpression(transform.cwd);
  }

  await initCommonResolve({ node, transformExpression });

  resolveNextBlock({ node });
}

export default {
  hits,
  init,
  resolve
};

