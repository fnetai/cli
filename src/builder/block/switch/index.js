const cloneDeep = require('lodash.clonedeep');
const initModules= require('../common/init-modules');

async function hits({ node }) {
    const hit = node.definition.hasOwnProperty('switch');
    if (!hit) return false;

    const switchChilds = node.definition.switch || [];

    const check = switchChilds.every(w => w.hasOwnProperty('condition') || w.hasOwnProperty('default'));
    if (!check) throw new Error(`Switch must have condition or default`);

    const conditionChilds = switchChilds.filter(w => w.hasOwnProperty('condition'));
    if (conditionChilds.length === 0) throw new Error(`Switch must have at least one condition`);

    const defaultChilds = switchChilds.filter(w => w.hasOwnProperty('default'));
    if (defaultChilds.length > 1) throw new Error(`Switch must have only one default`);

    if (defaultChilds.length === 1 && !switchChilds[switchChilds.length - 1].hasOwnProperty('default'))
        throw new Error(`Switch default must be the last child`);

    return true;
}

async function init({ node, initNode }) {
    node.type = "switch";

    await initModules({ node, initNode });
    
    node.blockAutoJumpToParent = false;
    node.blockAutoJumpToSibling = true;

    for (let i = 0; i < node.definition.switch.length; i++) {
        let temp = node.definition.switch[i];
        let key = `${i}`;

        if (temp.hasOwnProperty('default')) {
            key = 'default';
            temp = temp.default;
        }

        const childNode = {
            name: temp.condition || key,
            childs: [],
            parent: node,
            definition: temp,
            index: node.childs.length,
            context: {},
        }
        
        node.childs.push(childNode);

        await initNode({ node: childNode });
    }

    node.resolve = resolve;
}

async function resolve({ node, resolveTypeCommon, resolveNextBlock, transformExpression }) {
    node.context.transform = node.context.transform || cloneDeep(node.definition);

    const transform = node.context.transform;

    for (const child of node.childs) {
        child.context.transform = child.context.transform || cloneDeep(child.definition);

        if (child.definition.hasOwnProperty('condition'))
            child.context.transform.condition = await transformExpression(child.definition.condition);
    }

    if (transform.export)
      transform.export = await transformExpression(transform.export);

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