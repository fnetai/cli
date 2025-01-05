module.exports = async ({ node, initNode }) => {

  node.hasModules = node.definition.modules?.length > 0;
  
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
};