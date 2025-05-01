# CLI Modes

Flownet projects can be run in different modes. These modes can be selected using the `--cli-mode` parameter.

## Default Mode

The default mode runs the functional code directly.

```bash
fnode cli --param1 value1 --param2 value2
```

This mode:

- Executes the functional code with the provided arguments
- Returns the result to stdout
- Supports JSON output format with `--stdout_format=json`

## MCP Mode

The MCP mode runs the functional code as an MCP (Model Context Protocol) server. This mode is ideal for integration with LLM applications.

```bash
fnode cli --cli-mode=mcp
```

This mode:

- Starts an MCP server using the Model Context Protocol SDK
- Exposes the functional code as an MCP tool
- Uses stdio transport for communication with MCP clients

## HTTP Mode

The HTTP mode runs the functional code as an HTTP API. This mode is ideal for integration with web applications.

```bash
fnode cli --cli-mode=http --cli-port=8080
```

This mode:

- Starts an HTTP server using Node.js built-in http module
- Exposes the functional code as a POST endpoint at `/<project-name>`
- Returns the result as JSON
- Accepts input as JSON in the request body

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

When a mode is enabled, the necessary dependencies will be automatically added to the project:

- MCP mode: `@modelcontextprotocol/sdk`
- HTTP mode: Uses Node.js built-in http module (no additional dependencies)

## Implementation Details

The CLI modes are implemented using templating. The template generates code only for the enabled modes, which means:

- If MCP mode is not enabled, no MCP-related code is included in the final output
- If HTTP mode is not enabled, no HTTP-related code is included in the final output

This approach ensures that the final code is clean and only includes what is needed.
