export default async function initCommonResolve({ node, transformExpression }) {
  const transform = node.context.transform;

  if (Reflect.has(transform, 'export'))
    transform.export = await transformExpression(transform.export);

  if (Reflect.has(transform, 'return')) {
    node.hasReturn = true;
    transform.return = await transformExpression(transform.return);
  }

  if (Reflect.has(transform, 'output')) {
    transform.output = await transformExpression(transform.output);
  }

  if (Reflect.has(transform, 'assign')) {
    for (let i = 0; i < transform.assign?.length; i++) {
      let assign = transform.assign[i];
      if(Object.keys(assign).length === 0) {
        transform.assign.splice(i, 1);
        i--;
        continue;
      }
      let assignKey = Object.keys(assign)[0];
      let assingValue = assign[assignKey];

      let assignTransform = {
        key: await transformExpression(assignKey),
        value: await transformExpression(assingValue)
      }

      transform.assign[i] = assignTransform;
    }
  }

  if (Reflect.has(transform, 'result')) {
    if (typeof transform.result === 'string') {
      transform.result = [{ [transform.result]: "e::result" }];
    }

    for (let i = 0; i < transform.result?.length; i++) {
      let assign = transform.result[i];
      let assignKey = Object.keys(assign)[0];
      let assingValue = assign[assignKey];

      let assignTransform = {
        key: await transformExpression(assignKey),
        value: await transformExpression(assingValue)
      }

      transform.result[i] = assignTransform;
    }
  }
};