export default async function initCommonResolve({ node, transformExpression }) {
  const transform = node.context.transform;

  if (Reflect.has(transform, 'export'))
    transform.export = await transformExpression(transform.export);

  if (Reflect.has(transform, 'return')) {
    node.hasReturn = true;
    transform.return = await transformExpression(transform.return);
  }

  if (transform.hasOwnProperty('output')) {
    node.hasNextArgs = true;
    transform.output = await transformExpression(transform.output);
  }
};