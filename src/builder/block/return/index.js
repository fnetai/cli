const cloneDeep = require('lodash.clonedeep');

async function hits({ node }) {
    return node.definition.hasOwnProperty('return');
}

async function init({ node, initNode }) {
    node.type = "return";
    
    node.resolve = resolve;
}

async function resolve({ node, resolveTypeCommon, transformExpression }) {
    node.context.transform = node.context.transform || cloneDeep(node.definition);
    const transform = node.context.transform;
    node.returns = true;
    transform.return = await transformExpression(transform.return);
    await resolveTypeCommon({ node });
}

module.exports = {
    hits,
    init,
    resolve
}