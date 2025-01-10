module.exports = async ({ node, initNode }) => {

  if (Reflect.has(node.definition, 'modules') && !Array.isArray(node.definition.modules)) {
    const modules = node.definition.modules;

    node.definition.modules = [];

    Object.keys(modules).forEach(key => {
      const transformed = {
        ...modules[key]
      }

      if (node.type === 'modules') {
        transformed.export = transformed.export || `mod.${key}`;
      }

      node.definition.modules.push({
        [key]: transformed
      });
    });
  }

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