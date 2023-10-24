const cloneDeep = require('lodash.clonedeep');
const pick = require('lodash.pick');
const omit = require('lodash.omit');

const fnetExpression = require('@fnet/expression');

async function hits({ node }) {
    return node.definition.hasOwnProperty('raise');
}

async function init({ node, initNode }) {
    node.type = "raise";

    node.resolve = resolve;
}

async function resolve({ node, resolveTypeCommon, transformExpression }) {
    node.context.transform = node.context.transform || cloneDeep(node.definition);
    const transform = node.context.transform;

    transform.raise = await transformExpression(transform.raise);

    await resolveTypeCommon({ node });
}

module.exports = {
    hits,
    init,
    resolve
}