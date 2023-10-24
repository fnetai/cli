const cloneDeep = require('lodash.clonedeep');
const pick = require('lodash.pick');
const omit = require('lodash.omit');

const fnetExpression = require('@fnet/expression');

const callBlock = require('../call');

async function hits({ node }) {
    return node.definition.hasOwnProperty('yaml');
}

async function init(api) {
    const { node } = api;

    const name = 'yaml';
    const definition = node.definition;
    const valueType = typeof definition[name];
    if (valueType === 'string' || valueType === 'object') {
        definition.call = "npm:@fnet/yaml";
        if (valueType === 'string') definition.args = { file: definition[name] };
        else definition.args = definition[name];
        delete definition[name];
    }
    else throw new Error(`Unsupported ${name} usage`);

    await callBlock.init(api);
}

module.exports = {
    hits,
    init
}