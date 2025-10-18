import cloneDeep from 'lodash.clonedeep';
import initCommonResolve from '../common/init-common-resolve.js';

async function hits({ node }) {
  return node.definition.hasOwnProperty('retry');
}

async function init({ node, initNode }) {
  node.type = 'retry';

  // Support shorthand (number) and full object syntax
  const retryConfig = node.definition.retry;

  let retrySettings;

  if (typeof retryConfig === 'number') {
    // Shorthand: retry: 3
    retrySettings = {
      attempts: retryConfig,
      delay: 1000,
      backoff: 'exponential',
      maxDelay: null
    };
  } else if (typeof retryConfig === 'object') {
    // Full object: retry: { attempts: 3, delay: 1000, ... }
    retrySettings = {
      attempts: retryConfig.attempts || 3,
      delay: retryConfig.delay || 1000,
      backoff: retryConfig.backoff || 'exponential',
      maxDelay: retryConfig.maxDelay || null,
      on: retryConfig.on,
      onRetry: retryConfig.onRetry
    };
  } else {
    throw new Error(`Retry step '${node.name}' requires a number or object configuration`);
  }

  // Validate attempts
  if (!retrySettings.attempts || retrySettings.attempts < 1) {
    throw new Error(`Retry step '${node.name}' requires attempts >= 1`);
  }

  // Validate backoff strategy
  const validBackoffs = ['exponential', 'linear', 'fixed'];
  if (!validBackoffs.includes(retrySettings.backoff)) {
    throw new Error(`Retry step '${node.name}' has invalid backoff strategy '${retrySettings.backoff}'. Valid options: ${validBackoffs.join(', ')}`);
  }

  // Store retry configuration as object in node context
  node.context.retry = retrySettings;

  // Extract child definition (decorator pattern!)
  const { retry, ...childDef } = node.definition;

  // Create child node from remaining properties
  const childNode = {
    name: `${node.name}_retryable`,
    childs: [],
    parent: node,
    definition: childDef,
    index: 0,
    context: {}
  };

  node.childs.push(childNode);
  await initNode({ node: childNode });

  node.resolve = resolve;
}

async function resolve({ node, transformExpression, resolveNextBlock }) {
  node.context.transform = node.context.transform || cloneDeep(node.definition);
  const transform = node.context.transform;

  // Copy retry settings from context to transform
  transform.retry = cloneDeep(node.context.retry);

  // Transform expressions in retry config if they exist
  if (transform.retry.attempts && typeof transform.retry.attempts === 'string') {
    transform.retry.attempts = await transformExpression(transform.retry.attempts);
  }
  if (transform.retry.delay && typeof transform.retry.delay === 'string') {
    transform.retry.delay = await transformExpression(transform.retry.delay);
  }
  if (transform.retry.maxDelay && typeof transform.retry.maxDelay === 'string') {
    transform.retry.maxDelay = await transformExpression(transform.retry.maxDelay);
  }
  if (transform.retry.onRetry) {
    transform.retry.onRetry = await transformExpression(transform.retry.onRetry);
  }

  await initCommonResolve({ node, transformExpression });

  resolveNextBlock({ node });
}

export default {
  hits,
  init,
  resolve
};

