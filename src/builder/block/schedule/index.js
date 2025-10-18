import cloneDeep from 'lodash.clonedeep';
import initCommonResolve from '../common/init-common-resolve.js';

async function hits({ node }) {
  return node.definition.hasOwnProperty('schedule');
}

async function init({ node, initNode }) {
  node.type = 'schedule';

  // Get cron expression (schedule property should be a string)
  const cronExpression = node.definition.schedule;

  if (!cronExpression || typeof cronExpression !== 'string') {
    throw new Error(`Schedule step '${node.name}' requires a cron expression string`);
  }

  // Store cron in node context
  node.context.cron = cronExpression;

  // Extract child definition (everything except 'schedule')
  const { schedule, ...childDef } = node.definition;

  // Create child node from remaining properties
  const childNode = {
    name: `${node.name}_scheduled`,
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

  // Transform cron expression (in case it contains variables)
  if (transform.schedule) {
    transform.schedule = await transformExpression(transform.schedule);
  }

  await initCommonResolve({ node, transformExpression });

  resolveNextBlock({ node });
}

export default {
  hits,
  init,
  resolve
};

