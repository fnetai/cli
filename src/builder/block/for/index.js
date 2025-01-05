const cloneDeep = require('lodash.clonedeep');
const pick = require('lodash.pick');
const omit = require('lodash.omit');

const initModules= require('../common/init-modules');

async function hits({ node }) {
    return node.definition.hasOwnProperty('for');
}

async function init({ node, initNode }) {

    node.type = "for";

    await initModules({ node, initNode });
    
    node.blockAutoJumpToParent = true;
    node.blockAutoJumpToSibling = false;
    
    // No steps property
    if (!node.definition.for.hasOwnProperty('steps')) {
        const reserved = ['value', 'in'];
        const [self, child] = [pick(node.definition.for, reserved), omit(node.definition.for, reserved)];
        node.definition.for = self;
        node.definition.for.steps = [
            {
                [`${node.name}_step`]: child
            }
        ];
    }

    if (!Array.isArray(node.definition.for.steps)) {
        node.definition.for.steps = [
            {
                [`${node.name}_step`]: node.definition.for.steps
            }
        ];
    }

    for (let i = 0; i < node.definition.for.steps.length; i++) {

        const temp = node.definition.for.steps[i];
        const key = Object.keys(temp)[0];

        const childNode = {
            name: key,
            childs: [],
            parent: node,
            definition: temp[key],
            index: node.childs.length,
            context: {}
        }

        node.childs.push(childNode);

        await initNode({ node: childNode });
    }

    node.resolve = resolve;
}

async function resolve({ node, resolveTypeCommon, resolveNextBlock, transformExpression }) {
    node.context.transform = node.context.transform || cloneDeep(node.definition);
    const transform = node.context.transform;

    transform.for.in = await transformExpression(node.definition.for.in);

    if (transform.export)
      transform.export = await transformExpression(transform.export);

    if (Reflect.has(transform, 'return')){
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