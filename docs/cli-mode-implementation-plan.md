# Implementation Plan for MCP and HTTP CLI Modes

## 1. Overview

This plan details the addition of MCP (Model Context Protocol) and HTTP CLI modes to the Flownet framework. These modes will be selectable via the `--cli-mode` parameter and can be enabled in the project configuration.

## 2. Objectives

- Enable Flownet projects to run in different modes (default, mcp, http)
- Use templating to generate code only for enabled modes
- Automatically manage dependencies
- Keep the user experience simple and consistent
- Support multiple transport types for MCP mode
- Use macros for reusable code blocks in templates

## 3. Checklist

### Template Updates

- [x] Update fnode template to support MCP mode with multiple transport types
- [x] Update fnode template to support HTTP mode with Express
- [x] Update fnet template to support MCP mode with multiple transport types
- [x] Update fnet template to support HTTP mode with Express
- [x] Implement standardized variable references for customization
  - [x] MCP server name: `{{atom.doc.features.cli.mcp.name or atom.doc.name}}`
  - [x] MCP tool name: `{{atom.doc.features.cli.mcp.tool.name or atom.doc.name}}`
  - [x] MCP tool description: `{{atom.doc.features.cli.mcp.tool.description or atom.doc.description}}`
  - [x] HTTP endpoint path: `{{atom.doc.features.cli.http.path or atom.doc.name}}`
- [x] Create macros for reusable code blocks

### Dependency Management

- [ ] Update package.json generation to include MCP and HTTP dependencies
- [ ] Add @modelcontextprotocol/sdk dependency when MCP mode is enabled
- [ ] Add express dependency when HTTP mode is enabled

### Command Line Arguments

- [ ] Implement --cli-mode parameter (default, mcp, http)
- [ ] Implement --mcp-transport-type parameter (stdio, http)
- [ ] Implement --cli-port parameter for HTTP server
- [ ] Implement --stdout-format parameter for output formatting

### Testing

- [ ] Test default mode functionality
- [ ] Test MCP mode with stdio transport
- [ ] Test MCP mode with HTTP transport
- [ ] Test HTTP mode
- [ ] Test dependency management
- [ ] Test error handling for unknown modes

### Documentation

- [ ] Update README.md with CLI modes information
- [ ] Create CLI modes documentation
- [ ] Document command line arguments
- [ ] Document project configuration options