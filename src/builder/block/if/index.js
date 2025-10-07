import fnetExpression from '@fnet/expression';
import switchBlock from '../switch/index.js';

async function hits({ node }) {
  const keys = Object.keys(node.definition);

  // Check for if::expression syntax (OLD)
  const parsedKeys = keys.map(key => fnetExpression({ expression: key }));
  const ifProcessors = parsedKeys.filter(key => key?.processor === 'if');
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
  const parsedKeys = keys.map(key => fnetExpression({ expression: key }));

  const blocks = [];

  // Handle if block
  const ifProcessor = parsedKeys.find(key => key?.processor === 'if');

  if (ifProcessor) {
    // OLD SYNTAX: if::e::v.number > 100:
    const ifDefinition = node.definition[ifProcessor.expression];
    blocks.push({
      name: `${node.name}_if`,
      definition: ifDefinition,
      processor: ifProcessor,
    });
    delete node.definition[ifProcessor.expression];
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
  const elseifProcessors = parsedKeys.filter(key => key?.processor === 'elseif');
  let elseIfIndex = 0;

  for (const elseifProcessor of elseifProcessors) {
    // OLD SYNTAX: elseif::e::v.number > 10:
    const elseifDefinition = node.definition[elseifProcessor.expression];
    blocks.push({
      name: `${node.name}_elseif_${elseIfIndex++}`,
      definition: elseifDefinition,
      processor: elseifProcessor,
    });
    delete node.definition[elseifProcessor.expression];
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