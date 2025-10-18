import cloneDeep from 'lodash.clonedeep';
import initModules from '../common/init-modules.js';
import initCommonResolve from '../common/init-common-resolve.js';

/**
 * HTTP Block Handler
 * Supports both shorthand (string URL) and full object syntax
 */

async function hits({ node }) {
  return node.definition.hasOwnProperty('http');
}

async function init({ node, initNode }) {
  node.type = 'http';

  // Initialize modules (enables m:: prefix for dynamic properties)
  await initModules({ node, initNode });

  // Support shorthand (string URL) and full object syntax
  const httpConfig = node.definition.http;

  let httpSettings;

  if (typeof httpConfig === 'string') {
    // Shorthand: http: "https://api.example.com/users"
    httpSettings = {
      url: httpConfig,
      method: 'GET',
      headers: {},
      timeout: 30000
    };
  } else if (typeof httpConfig === 'object') {
    // Full object: http: { url: "...", method: "POST", ... }
    httpSettings = {
      url: httpConfig.url,
      method: httpConfig.method || 'GET',
      headers: httpConfig.headers || {},
      body: httpConfig.body,
      params: httpConfig.params,
      timeout: httpConfig.timeout || 30000
    };

    // Validate URL is provided
    if (!httpSettings.url) {
      throw new Error(`HTTP step '${node.name}' requires a url property`);
    }
  } else {
    throw new Error(`HTTP step '${node.name}' requires a string URL or object configuration`);
  }

  // Validate method
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
  const method = httpSettings.method.toUpperCase();
  if (!validMethods.includes(method)) {
    throw new Error(`HTTP step '${node.name}' has invalid method '${httpSettings.method}'. Valid options: ${validMethods.join(', ')}`);
  }
  httpSettings.method = method;

  // Validate timeout
  if (httpSettings.timeout && (typeof httpSettings.timeout !== 'number' || httpSettings.timeout <= 0)) {
    throw new Error(`HTTP step '${node.name}' timeout must be a positive number`);
  }

  // Store HTTP configuration back to definition (normalized)
  node.definition.http = httpSettings;

  // HTTP step doesn't have child nodes (it's a leaf step like 'call')
  // No need to extract child definition

  node.resolve = resolve;
}

async function resolve({ node, transformExpression, resolveNextBlock }) {
  node.context.transform = node.context.transform || cloneDeep(node.definition);
  const transform = node.context.transform;

  // Transform expressions in HTTP config
  if (transform.http.url && typeof transform.http.url === 'string') {
    transform.http.url = await transformExpression(transform.http.url);
  }

  if (transform.http.headers) {
    for (const key in transform.http.headers) {
      if (typeof transform.http.headers[key] === 'string') {
        transform.http.headers[key] = await transformExpression(transform.http.headers[key]);
      }
    }
  }

  if (transform.http.body) {
    transform.http.body = await transformExpression(transform.http.body);
  }

  if (transform.http.params) {
    for (const key in transform.http.params) {
      if (typeof transform.http.params[key] === 'string') {
        transform.http.params[key] = await transformExpression(transform.http.params[key]);
      }
    }
  }

  if (transform.http.timeout && typeof transform.http.timeout === 'string') {
    transform.http.timeout = await transformExpression(transform.http.timeout);
  }

  await initCommonResolve({ node, transformExpression });

  resolveNextBlock({ node });
}

export default {
  hits,
  init
};

