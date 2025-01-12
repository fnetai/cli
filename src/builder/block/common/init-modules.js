const fnetKvTransformer = require('@fnet/key-value-transformer');
const fnetExpression = require('@fnet/expression');

module.exports = async ({ node, initNode }) => {

  if (Reflect.has(node.definition, 'modules') && !Array.isArray(node.definition.modules)) {
    const modules = node.definition.modules;

    node.definition.modules = [];

    Object.keys(modules).forEach(key => {
      const transformed = {
        ...modules[key]
      }

      if (node.type === 'modules') {
        transformed.export = transformed.export || key;
      }

      node.definition.modules.push({
        [key]: transformed
      });
    });
  }

  const extraModules = [];

  const newOne = await fnetKvTransformer({
    data: node.definition, callback: (key, value, path) => {
      // if (typeof key === 'number') {
      //   debugger;
      // }

      const exp = fnetExpression({ expression: key });
      if (exp?.processor === 'm') {
        const newPath = path.slice(0, -1);
        newPath.push(exp.statement);
        const name = newPath.join('_');

        extraModules.push({
          [name]: value
        });

        return [exp.statement, `m::${name}`];
      }
      return [key, value];
    }
  });

  if (extraModules.length > 0) {
    node.definition = newOne;
    node.definition.modules = node.definition.modules || [];
    node.definition.modules = node.definition.modules.concat(extraModules);
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