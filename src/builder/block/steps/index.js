const cloneDeep = require('lodash.clonedeep');

async function hits({ node }) {
    return node.definition.hasOwnProperty('steps');
}

async function init({ node, initNode }) {
    if (!node.type) node.type = 'steps';

    const steps = node.definition.steps || [];
    for await (const step of steps) {
        const key = Object.keys(step)[0];
        const childNode = {
            name: key,
            childs: [],
            parent: node,
            definition: step[key],
            index: node.childs.length,
            context: {
            }
        }

        node.childs.push(childNode);

        await initNode({ node: childNode });
    }

    node.resolve = resolve;
}

async function resolve({ node, transformExpression  }) {
    node.context.next = node.childs[0];

    node.context.transform = node.context.transform || cloneDeep(node.definition);

    const transform = node.context.transform;

    if (transform.export)
      transform.export = await transformExpression(transform.export);

    if (Reflect.has(transform, 'return')){
      node.returns = true;
      transform.return = await transformExpression(transform.return);
    }
}

module.exports = {
    hits,
    init,
    resolve
}