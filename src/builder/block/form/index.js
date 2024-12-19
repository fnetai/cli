const cloneDeep = require('lodash.clonedeep');

async function hits({ node }) {
    return node.definition.hasOwnProperty('form');
}

async function init({ node, initNode }) {
    node.type = "form";

    for (let i = 0; i < node.definition.modules?.length; i++) {
        const temp = node.definition.modules[i];
        const key = Object.keys(temp)[0];

        const childNode = {
            name: key,
            childs: [],
            parent: node,
            definition: temp[key],
            module: true,
            blockAutoJumpToParent: true,
            blockAutoJumpToSibling: false,
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

    if (transform.props)
        transform.props = await transformExpression(transform.props);

    const root = node.workflow.parent;

    node.context.lib = root.context.libs.find(w => w.name === transform.form);

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