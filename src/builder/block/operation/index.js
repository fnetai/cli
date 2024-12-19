const cloneDeep = require('lodash.clonedeep');

async function hits({ node }) {
    return node.definition.hasOwnProperty('operation');
}

async function init({ node, initNode }) {
    node.type = "operation";

    node.resolve = resolve;
}

async function resolve({ node, resolveTypeCommon, resolveNextBlock, transformExpression, transformValue }) {
    node.context.transform = node.context.transform || cloneDeep(node.definition);
    
    await resolveTypeCommon({ node });    
}

module.exports = {
    hits,
    init,
    resolve
}