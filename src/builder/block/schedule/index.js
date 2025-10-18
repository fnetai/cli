import cloneDeep from 'lodash.clonedeep';
import initCommonResolve from '../common/init-common-resolve.js';

async function hits({ node }) {
  return node.definition.hasOwnProperty('schedule');
}

async function init({ node, initNode }) {
  node.type = 'schedule';

  // Support shorthand (string) and full object syntax
  const scheduleConfig = node.definition.schedule;

  let scheduleSettings;

  if (typeof scheduleConfig === 'string') {
    // Shorthand: schedule: "*/5 * * * *"
    scheduleSettings = {
      cron: scheduleConfig,
      timezone: null,
      enabled: true
    };
  } else if (typeof scheduleConfig === 'object') {
    // Full object: schedule: { cron: "...", timezone: "...", enabled: true }
    scheduleSettings = {
      cron: scheduleConfig.cron,
      timezone: scheduleConfig.timezone || null,
      enabled: scheduleConfig.enabled !== false  // Default to true
    };
  } else {
    throw new Error(`Schedule step '${node.name}' requires a cron expression string or object`);
  }

  // Validate cron expression
  if (!scheduleSettings.cron || typeof scheduleSettings.cron !== 'string') {
    throw new Error(`Schedule step '${node.name}' requires a valid cron expression`);
  }

  // Store schedule configuration back to definition (normalized)
  node.definition.schedule = scheduleSettings;

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

  // Transform schedule properties (in case they contain expressions)
  if (transform.schedule) {
    if (transform.schedule.cron && typeof transform.schedule.cron === 'string') {
      transform.schedule.cron = await transformExpression(transform.schedule.cron);
    }
    if (transform.schedule.timezone && typeof transform.schedule.timezone === 'string') {
      transform.schedule.timezone = await transformExpression(transform.schedule.timezone);
    }
  }

  await initCommonResolve({ node, transformExpression });

  resolveNextBlock({ node });
}

export default {
  hits,
  init,
  resolve
};

