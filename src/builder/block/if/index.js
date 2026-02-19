import { getProcessor } from '../../expression/index.js';
import switchBlock from '../switch/index.js';

async function hits({ node }) {
  const keys = Object.keys(node.definition);

  // Check for if::expression syntax (OLD)
  // Use light version - only need processor signal
  const ifProcessors = keys.filter(key => getProcessor(key) === 'if');
  if (ifProcessors.length === 1) return true;

  // Check for if: {condition: ...} syntax (NEW)
  if (node.definition.if && typeof node.definition.if === 'object') {
    return true;
  }

  return false;
}

async function init(api) {
  const { node } = api;

  const keys = Object.keys(node.definition);

  const blocks = [];

  // Handle if block
  // Use light version - only need to find if:: key
  const ifKey = keys.find(key => getProcessor(key) === 'if');

  if (ifKey) {
    // OLD SYNTAX: if::e::v.number > 100:
    const ifDefinition = node.definition[ifKey];

    // Get processor and statement
    const parsed = getProcessor(ifKey, true);

    blocks.push({
      name: `${node.name}_if`,
      definition: ifDefinition,
      processor: {
        expression: ifKey,
        statement: parsed.statement,
        processor: parsed.processor
      },
    });
    delete node.definition[ifKey];
  } else if (node.definition.if) {
    // NEW SYNTAX: if: { condition: e::v.number > 100, steps: [...] }
    const {condition, ...ifDef} = node.definition.if;

    blocks.push({
      name: `${node.name}_if`,
      definition: ifDef,
      processor: {
        expression: `if::${condition}`,
        // Use process.statement to get the final statement after all processors
        statement: condition,
      },
    });
    delete node.definition.if;
  }

  // Handle elseif blocks - OLD SYNTAX
  const elseifKeys = keys.filter(key => getProcessor(key) === 'elseif');
  let elseIfIndex = 0;

  for (const elseifKey of elseifKeys) {
    // OLD SYNTAX: elseif::e::v.number > 10:
    const elseifDefinition = node.definition[elseifKey];

    // Get processor and statement
    const parsed = getProcessor(elseifKey, true);

    blocks.push({
      name: `${node.name}_elseif_${elseIfIndex++}`,
      definition: elseifDefinition,
      processor: {
        expression: elseifKey,
        statement: parsed.statement,
        processor: parsed.processor
      },
    });
    delete node.definition[elseifKey];
  }

  // Handle elseif blocks - NEW SYNTAX
  if (node.definition.elseif) {
    // NEW SYNTAX: elseif: { condition: e::..., <any step type> }
    // Note: Only single elseif supported in clean syntax due to YAML duplicate key limitation
    // For multiple elseif, use double-colon syntax: elseif::e::condition:
    const {condition, ...restDefinition} = node.definition.elseif;

    blocks.push({
      name: `${node.name}_elseif_${elseIfIndex++}`,
      definition: restDefinition,
      processor: {
        expression: `elseif::${condition}`,
        statement: condition,
      },
    });
    delete node.definition.elseif;
  }

  // Transform to switch structure
  node.definition.switch = [];

  for (const block of blocks) {
    node.definition.switch.push({
      condition: block.processor.statement,
      ...block.definition
    });
  }

  // Handle else
  if (node.definition?.else) {
    const elseDefinition = node.definition.else;

    node.definition.switch.push({
      default: elseDefinition,
    });

    delete node.definition['else'];
  }

  await switchBlock.init(api);
}

export default {
  hits,
  init
};