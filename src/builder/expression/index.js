/**
 * Flownet CLI Expression Parser
 *
 * Flow-specific expression parser for build-time use only.
 * Supports grammar-based parsing with Peggy, transforms, and multiline.
 *
 * This is NOT for runtime use - use @fnet/expression for runtime parsing.
 *
 * @module flownet-cli/expression
 */

import { parse as grammarParse } from './grammar.js';

/**
 * Legacy regex-based parser (for backward compatibility)
 *
 * @param {Object} param0 - Contains the expression to be parsed and the current depth level.
 * @param {string} param0.expression - The expression to be parsed.
 * @param {number} [param0.depth=5] - The current depth level.
 * @returns {Object|null} - Returns the parsed expression or null if it doesn't match the pattern.
 */
function legacyParseExpression({ expression, depth = 5 }) {
  // Return null if maximum depth is reached
  if (depth <= 0) return null;

  // Regex pattern to match processor and statement
  const patternBase = /^([a-z][a-z0-9_-]*)::([^\s][\s\S]*)$/;
  let matches;

  // Validate expression against the pattern
  if (patternBase.test(expression)) {
      matches = expression.match(patternBase);
  } else return null;

  const processor = matches[1];
  const statement = matches[2];
  // Recursively parse nested expressions
  const next = legacyParseExpression({ expression: statement, depth: depth - 1 });

  const result = {
      processor,
      statement,
      expression
  };

  // Include nested expression in the result if exists
  if (next) {
      result.next = next;
  }

  return result;
}

/**
* Extracts all processors from the parsed expression.
*
* @param {Object} parsed - The parsed expression.
* @returns {Array<string>} - Returns an array of processors.
*/
function extractProcessors(parsed) {
  if (!parsed) return [];

  const processors = extractProcessors(parsed.next);
  processors.push(parsed.processor);
  return processors;
}

/**
 * Legacy parser wrapper
 *
 * @param {Object} param0 - Contains the expression to be parsed.
 * @param {string} param0.expression - The expression to be parsed.
 * @returns {Object|null} - Returns the components of the parsed expression or null if it doesn't match the pattern.
 */
function legacyParse({ expression }) {
  const parsed = legacyParseExpression({ expression });

  if (!parsed) return null;

  // Find the deepest nested expression
  let current = parsed;
  while (current && current.next) {
      current = current.next;
  }

  const result = {
      processor: parsed.processor,
      statement: parsed.statement,
      expression: parsed.expression,
      process: {
          statement: current.statement,
          order: extractProcessors(parsed)
      }
  };

  // Include nested expression if available
  if (parsed.next) {
      result.next = parsed.next;
  }

  return result;
}

/**
 * Apply transforms to parsed expression
 *
 * Transforms can be:
 * - Template strings: "c.for.{stmt}" where {stmt} is replaced with the statement
 * - Functions: (stmt) => `c.for.${stmt}` (for programmatic use)
 *
 * @param {Object} parsed - Parsed expression
 * @param {Object} transform - Transform templates or functions
 * @returns {string} - Transformed statement
 */
function applyTransforms(parsed, transform) {
  let statement = parsed.statement;

  // Find all processor patterns in the statement
  const processorPattern = /([a-z][a-z0-9_-]*)::([a-zA-Z_$][a-zA-Z0-9_$]*)/g;

  statement = statement.replace(processorPattern, (match, proc, stmt) => {
    if (transform[proc]) {
      const transformer = transform[proc];

      // If it's a function, call it
      if (typeof transformer === 'function') {
        return transformer(stmt);
      }

      // If it's a string template, replace {stmt} placeholder
      if (typeof transformer === 'string') {
        return transformer.replace(/\{stmt\}/g, stmt);
      }
    }
    return match;
  });

  return statement;
}

/**
 * Flow-specific expression parser
 *
 * @param {Object} options - Parser options
 * @param {string} options.expression - The expression to be parsed
 * @param {boolean} [options.useGrammar=true] - Use grammar-based parser (default: true)
 * @param {boolean} [options.multiline=true] - Normalize multiline expressions (default: true)
 * @param {Object} [options.transform] - Transform functions for processors
 * @returns {Object|null} - Parsed expression or null
 */
export function parseFlowExpression({ expression, useGrammar = true, multiline = true, transform }) {
  // Convert non-string expressions to string
  if (typeof expression !== 'string') {
    expression = String(expression);
  }

  // Normalize multiline if requested
  if (multiline) {
    expression = expression.replace(/\s+/g, ' ').trim();
  }

  let result;

  // Try grammar-based parser first
  if (useGrammar) {
    try {
      result = grammarParse(expression);
    } catch (e) {
      // Fallback to legacy parser
      result = legacyParse({ expression });
    }
  } else {
    // Use legacy parser
    result = legacyParse({ expression });
  }

  if (!result) return null;

  // Apply transforms if provided
  if (transform) {
    // For simple processors (v::, for::, m::, f::), apply direct transform
    if (transform[result.processor] && !result.next) {
      const transformer = transform[result.processor];
      if (typeof transformer === 'function') {
        result.transformed = transformer(result.statement);
      } else if (typeof transformer === 'string') {
        result.transformed = transformer.replace(/\{stmt\}/g, result.statement);
      }
    }
    // For complex expressions (e:: with nested processors), apply nested transforms
    else if (result.statement) {
      result.transformed = applyTransforms(result, transform);
    }
  }

  return result;
}

// Default export for backward compatibility
export default parseFlowExpression;

