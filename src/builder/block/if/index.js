import fnetExpression from '@fnet/expression';
import switchBlock from '../switch/index.js';

async function hits({ node }) {
  const keys = Object.keys(node.definition);
  const parsedKeys = keys.map(key => fnetExpression({ expression: key }));

  const ifProcessors = parsedKeys.filter(key => key?.processor === 'if');
  if (ifProcessors.length !== 1) return false;

  return true;
}

async function init(api) {
  const { node } = api;

  const keys = Object.keys(node.definition);
  const parsedKeys = keys.map(key => fnetExpression({ expression: key }));

  const blocks = [];

  // if
  const ifProcessor = parsedKeys.find(key => key?.processor === 'if');

  const ifDefinition = node.definition[ifProcessor.expression];

  blocks.push({
    name: `${node.name}_if`,
    definition: ifDefinition,
    processor: ifProcessor,
  });
  delete node.definition[ifProcessor.expression];

  // else if
  const elseifProcessors = parsedKeys.filter(key => key?.processor === 'elseif');
  let elseIfIndex = 0;
  for (const elseifProcessor of elseifProcessors) {
    const elseifDefinition = node.definition[elseifProcessor.expression];

    blocks.push({
      name: `${node.name}_elseif_${elseIfIndex++}`,
      definition: elseifDefinition,
      processor: elseifProcessor,
    });
    delete node.definition[elseifProcessor.expression];
  }

  node.definition.switch = [];

  for (const block of blocks) {
    node.definition.switch.push({
      condition: block.processor.statement,
      ...block.definition
    });
  }

  // else
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