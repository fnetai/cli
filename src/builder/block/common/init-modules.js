import fnetKvTransformer from '@fnet/key-value-transformer';
import fnetExpression from '@fnet/expression';

export default async function initModules({ node, initNode, extra = true }) {

  if (Reflect.has(node.definition, 'modules') && !Array.isArray(node.definition.modules)) {
    const modules = node.definition.modules;

    node.definition.modules = [];

    Object.keys(modules).forEach(key => {
      const transformed = {
        ...modules[key]
      }

      if (typeof transformed.export === 'boolean')
        transformed.export = transformed.export === true ? key : false;
      else if (typeof transformed.export === 'string')
        transformed.export = transformed.export;
      else delete transformed.export;

      node.definition.modules.push({
        [key]: transformed
      });
    });
  }

  if (extra) {
    const extraModules = [];

    const newOne = await fnetKvTransformer({
      data: node.definition, callback: (key, value, path) => {
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