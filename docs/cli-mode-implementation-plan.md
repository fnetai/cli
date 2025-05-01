# Implementation Plan for MCP and HTTP CLI Modes

## 1. Overview

This plan details the addition of MCP (Model Context Protocol) and HTTP CLI modes to the Flownet framework. These modes will be selectable via the `--cli-mode` parameter and can be enabled in the project configuration.

## 2. Objectives

- Enable Flownet projects to run in different modes (default, mcp, http)
- Use templating to generate code only for enabled modes
- Automatically manage dependencies
- Keep the user experience simple and consistent

## 3. Changes

### 3.1. Project Configuration Files

#### fnode.yaml and fnet.yaml

```yaml
name: example-project
version: 1.0.0
features:
  cli:
    enabled: true
    mcp:
      enabled: true  # MCP mode enabled
    http:
      enabled: true  # HTTP mode enabled
```

### 3.2. Template Files

#### 3.2.1. fnode/node/src/cli/index.js.njk

```nunjucks
{% if atom.doc.features.cli.enabled===true %}

import argv from '../default/to.args.js';
import Node from '../../../src';

{% if atom.doc.features.cli.mcp.enabled===true %}
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
{% endif %}

{% if atom.doc.features.cli.http.enabled===true %}
import express from 'express';
{% endif %}

const run = async () => {
  const args = await argv();
  const cliMode = args['cli-mode'] || args.cli_mode || 'default';

  if (cliMode === 'default') {
    // Default mode code
    const result = await Node(args);

    if (typeof result !== 'undefined') {
      const stdout_format = args['stdout-format'] || args.stdout_format || null;

      if (stdout_format === 'json') console.log(JSON.stringify(result, null, 2));
      else console.log(result);
    }
    return;
  }

  {% if atom.doc.features.cli.mcp.enabled===true %}
  if (cliMode === 'mcp') {
    // MCP mode code
    const server = new McpServer({
      name: "{{atom.doc.name}}",
      version: "{{atom.doc.version}}"
    });

    server.tool(
      "{{atom.doc.name}}",
      async (toolArgs) => {
        try {
          const result = await Node(toolArgs);
          return {
            content: [{
              type: "text",
              text: JSON.stringify(result)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error: ${error.message}`
            }],
            isError: true
          };
        }
      }
    );

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("MCP server started with stdio transport");
    return;
  }
  {% endif %}

  {% if atom.doc.features.cli.http.enabled===true %}
  if (cliMode === 'http') {
    // HTTP mode code
    const app = express();
    app.use(express.json());

    app.post('/{{atom.doc.name}}', async (req, res) => {
      try {
        const result = await Node(req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    const port = args.port || 3000;
    app.listen(port, () => {
      console.log(`HTTP server started on port ${port}`);
    });
    return;
  }
  {% endif %}

  console.error(`Unknown CLI mode: ${cliMode}`);
  process.exit(1);
};

run()
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });

{% endif %}
```

#### 3.2.2. fnet/node/src/cli/index.js.njk

```nunjucks
{% if atom.doc.features.cli.enabled===true %}

import argv from '../default/to.args.js';
import { default as Engine } from '../default/{{atom.doc.features.cli_default_entry_file or atom.doc.features.main_default_entry_file}}';

{% if atom.doc.features.cli.mcp.enabled===true %}
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
{% endif %}

{% if atom.doc.features.cli.http.enabled===true %}
import express from 'express';
{% endif %}

const run = async () => {
  const args = await argv();
  const cliMode = args['cli-mode'] || args.cli_mode || 'default';
  const engine = new Engine();

  if (cliMode === 'default') {
    // Default mode code
    const result = await engine.run(args);

    if (typeof result !== 'undefined') {
      const stdout_format = args['stdout-format'] || args.stdout_format || null;

      if (stdout_format === 'json') console.log(JSON.stringify(result, null, 2));
      else console.log(result);
    }
    return;
  }

  {% if atom.doc.features.cli.mcp.enabled===true %}
  if (cliMode === 'mcp') {
    // MCP mode code
    const server = new McpServer({
      name: "{{atom.doc.name}}",
      version: "{{atom.doc.version}}"
    });

    server.tool(
      "{{atom.doc.name}}",
      async (toolArgs) => {
        try {
          const result = await engine.run(toolArgs);
          return {
            content: [{
              type: "text",
              text: JSON.stringify(result)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error: ${error.message}`
            }],
            isError: true
          };
        }
      }
    );

    // Add workflow nodes as MCP tools
    for (const node of engine.nodes || []) {
      server.tool(
        `${atom.doc.name}.${node.name}`,
        async (toolArgs) => {
          try {
            const result = await node.run(toolArgs);
            return {
              content: [{
                type: "text",
                text: JSON.stringify(result)
              }]
            };
          } catch (error) {
            return {
              content: [{
                type: "text",
                text: `Error: ${error.message}`
              }],
              isError: true
            };
          }
        }
      );
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("MCP server started with stdio transport");
    return;
  }
  {% endif %}

  {% if atom.doc.features.cli.http.enabled===true %}
  if (cliMode === 'http') {
    // HTTP mode code
    const app = express();
    app.use(express.json());

    app.post('/{{atom.doc.name}}', async (req, res) => {
      try {
        const result = await engine.run(req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Add endpoints for workflow nodes
    for (const node of engine.nodes || []) {
      app.post(`/{{atom.doc.name}}/${node.name}`, async (req, res) => {
        try {
          const result = await node.run(req.body);
          res.json(result);
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      });
    }

    const port = args.port || 3000;
    app.listen(port, () => {
      console.log(`HTTP server started on port ${port}`);
    });
    return;
  }
  {% endif %}

  console.error(`Unknown CLI mode: ${cliMode}`);
  process.exit(1);
};

run()
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });

{% endif %}
```

### 3.3. Dependency Management

#### 3.3.1. src/builder/api/create-package-json/index.js

```javascript
// Determine dependencies
const dependencies = {};

// Base dependencies
dependencies["@fnet/core"] = "latest";

// If MCP mode is enabled
if (atom.doc.features.cli.mcp && atom.doc.features.cli.mcp.enabled) {
  dependencies["@modelcontextprotocol/sdk"] = "latest";
}

// HTTP mode uses Node.js built-in http module, no additional dependencies needed

// Create package.json
const packageJson = {
  name: atom.doc.name,
  version: atom.doc.version,
  dependencies: dependencies,
  // ...
};
```

## 4. Usage Examples

### 4.1. Default Mode

```bash
fnode cli -- --param1 value1 --param2 value2
```

### 4.2. MCP Mode

```bash
fnode cli -- --cli-mode=mcp
```

### 4.3. HTTP Mode

```bash
fnode cli -- --cli-mode=http --port=8080
```

## 5. Documentation

### 5.1. CLI Modes Documentation

```markdown
# CLI Modes

Flownet projects can be run in different modes. These modes can be selected using the `--cli-mode` parameter.

## Default Mode

The default mode runs the functional code directly.

```bash
fnode cli --param1 value1 --param2 value2
```

## MCP Mode

The MCP mode runs the functional code as an MCP (Model Context Protocol) server. This mode is ideal for integration with LLM applications.

```bash
fnode cli --cli-mode=mcp
```

## HTTP Mode

The HTTP mode runs the functional code as an HTTP API. This mode is ideal for integration with web applications.

```bash
fnode cli --cli-mode=http --cli-port=8080
```

## Enabling Modes

CLI modes can be enabled in the project configuration file:

```yaml
features:
  cli:
    enabled: true
    mcp:
      enabled: true  # MCP mode enabled
    http:
      enabled: true  # HTTP mode enabled
```

## 6. Test Plan

1. **Default Mode Test**: Verify that the default mode works correctly
2. **MCP Mode Test**: Verify that the MCP mode works correctly and can integrate with LLM applications
3. **HTTP Mode Test**: Verify that the HTTP mode works correctly and can integrate with web applications
4. **Dependency Test**: Verify that dependencies are added correctly
5. **Error Case Test**: Verify that the correct error message is displayed when an unknown mode is specified

## 7. Timeline

1. **Day 1-2**: Update template files
2. **Day 3-4**: Update dependency management
3. **Day 5-6**: Write and run tests
4. **Day 7**: Update documentation
5. **Day 8**: Review and fixes

## 8. Conclusion

This plan details the addition of MCP and HTTP CLI modes to the Flownet framework. These modes will enable Flownet projects to be used in different contexts and expand their use cases. By using templating, code will only be generated for enabled modes, and dependencies will be managed automatically.
