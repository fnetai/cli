const callBlock = require('../call');

async function hits({ node }) {
    return node.definition.hasOwnProperty('prompt');
}

async function init(api) {
    const { node } = api;

    const name = 'prompt';
    const definition = node.definition;
    const valueType = typeof definition[name];
    if (valueType === 'string' || valueType === 'object') {
        definition.call = "npm:@fnet/prompt";
        if (valueType === 'string') definition.args = { ...definition.args, message: definition[name] };
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