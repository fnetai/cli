const callBlock = require('../call');

async function hits({ node }) {
    return node.definition.hasOwnProperty('html-script');
}

async function init(api) {
    const { node } = api;

    const name = 'html-script';
    const definition = node.definition;
    const valueType = typeof definition[name];
    if (valueType === 'string' || valueType === 'object') {
        definition.call = "npm:@flownet/lib-load-browser-script-url";
        if (valueType === 'string') definition.args = { src: definition[name] };
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