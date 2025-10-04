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

  if (transform.hasOwnProperty('assign')) {
    for (let i = 0; i < transform.assign?.length; i++) {
      let assign = transform.assign[i];
      let assignKey = Object.keys(assign)[0];
      let assingValue = assign[assignKey];

      let assignTransform = {
        key: await transformExpression(assignKey),
        value: await transformExpression(assingValue)
      }

      transform.assign[i] = assignTransform;
    }
  }
};