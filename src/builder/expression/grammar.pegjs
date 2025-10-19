/**
 * Flownet Expression Grammar
 * 
 * Parses expressions like:
 * - for::row
 * - e::for::row
 * - e::for::row + for::cell
 * - e::v::items.filter(x => x.active).map(x => x.name)
 */

{
  function buildResult(processor, statement, expression) {
    return {
      processor,
      statement,
      expression
    };
  }

  function extractProcessors(parsed) {
    if (!parsed) return [];
    const processors = parsed.next ? extractProcessors(parsed.next) : [];
    processors.push(parsed.processor);
    return processors;
  }

  function buildFullResult(parsed) {
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
}

// Main entry point
Start
  = expr:Expression { return buildFullResult(expr); }

// Expression: processor::statement
Expression
  = processor:Processor "::" statement:Statement {
      const expression = processor + '::' + statement;
      const result = buildResult(processor, statement, expression);
      
      // Try to parse nested expression
      try {
        const nested = parse(statement);
        if (nested) {
          result.next = nested;
        }
      } catch (e) {
        // Not a nested expression, that's ok
      }
      
      return result;
    }

// Processor: lowercase identifier with optional hyphens/underscores
Processor
  = $([a-z][a-z0-9_-]*)

// Statement: everything after ::
Statement
  = $([^\s][\s\S]*)

