const cloneDeep = require('lodash.clonedeep');
const pick = require('lodash.pick');
const omit = require('lodash.omit');

const fnetExpression = require('@fnet/expression');

async function hits({ node }) {
    return node.definition.hasOwnProperty('next');
}

async function init({ node, initNode }) {
    node.type = "jump";

    node.resolve = resolve;    
}

async function resolve({ node, resolveTypeCommon, resolveNextBlock, transformExpression }) {
    node.context.transform = node.context.transform || cloneDeep(node.definition);
    const transform = node.context.transform;

    transform.next = await transformExpression(transform.next);

    await resolveTypeCommon({ node });
    resolveNextBlock({ node });    
}

module.exports = {
    hits,
    init,
    resolve
}