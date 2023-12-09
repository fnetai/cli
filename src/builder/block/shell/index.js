const callBlock = require('../call');

async function hits({ node }) {
    return node.definition.hasOwnProperty('shell');
}

async function init(api) {
    const { node } = api;

    const name = 'shell';
    const definition = node.definition;
    const valueType = typeof definition[name];
    if (valueType === 'string' || valueType === 'object') {
        definition.call = "npm:@fnet/shell";
        if (valueType === 'string') definition.args = {...definition.args,  cmd: definition[name] };
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