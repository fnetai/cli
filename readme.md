# @fnet/cli: Flownet CLI

<p align="center">
  <img src="https://raw.githubusercontent.com/fnetai/cli/main/assets/flownet-logo.png" alt="Flownet Logo" width="200"/>
</p>

<p align="center">
  <b>Give developers primitives. Trust them to compose. Make the tooling excellent.</b>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@fnet/cli"><img src="https://img.shields.io/npm/v/@fnet/cli.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@fnet/cli"><img src="https://img.shields.io/npm/dm/@fnet/cli.svg" alt="npm downloads"></a>
  <a href="https://github.com/fnetai/cli/blob/main/LICENSE"><img src="https://img.shields.io/github/license/fnetai/cli.svg" alt="license"></a>
</p>

---

## Why Flownet?

Most developers spend the majority of their time on things that aren't their actual problem: build configuration, bundling, runtime wiring, deployment pipelines, service setup. The ratio of "infrastructure work" to "actual logic" is often 80/20 in the wrong direction.

Flownet exists to flip that ratio. It separates what you write (**Core**) from what surrounds it (**Layers**), then automates the Layers so you can focus on the Core.

- **Core**: Your functional, minimal, deterministic logic and its I/O contracts
- **Layers**: Dev experience, build pipelines, runtime wiring, delivery/packaging

You write the Core. Flownet generates, manages, and updates the Layers automatically. Update all Layer infrastructure across every project by updating the CLI.

| Project Type | Core (you write)  | Layers (Flownet handles)        |
| ------------ | ----------------- | ------------------------------- |
| CLI          | Command logic     | Binary + PATH/runtime + publish |
| App          | UI/flows          | Bundling + hosting/CDN + deploy |
| Component    | API/behavior      | ESM/CJS/types + publish         |

This is the same philosophy that made React successful for UI: provide primitives, trust developers to compose, make the tooling excellent. Flownet applies it to the entire development lifecycle.

## What You Get

```text
@fnet/cli (npm package)
    |
    |- fnode ---------> Node/Classic Projects (fnode.yaml)
    |                   Create, build, deploy reusable Nodes
    |
    |- fnet ----------> Workflow Projects (fnet.yaml)
    |                   Create, build, deploy Flows
    |
    |- frun ----------> Unified Command Runner
    |                   Auto-detect project type, run command groups
    |                   Powered by @fnet/shell-flow
    |
    |- fbin ----------> Binary Management
    |                   Compile JS to native binaries
    |                   Install to ~/.fnet/bin/
    |
    '- fservice ------> Service Management
                        Cross-platform system services
                        (systemd, launchd, Windows Services)
```

Five CLI tools that work together to cover the full development lifecycle: create, develop, build, distribute, and run as a service.

## Installation

```bash
npm install -g @fnet/cli
```

On first install, pre-compiled native binaries (`frun`, `fbin`, `fservice`) are downloaded for your platform (macOS/Linux/Windows, arm64/x64). If the download fails, the JavaScript versions work as a fallback.

### Homebrew (macOS/Linux)

Native binaries for `frun`, `fbin`, and `fservice` are also available via Homebrew:

```bash
brew tap fnetai/tap
brew install fnet
```

> **Note:** Homebrew installs only the pre-compiled native binaries (`frun`, `fbin`, `fservice`). For the full CLI including `fnode` and `fnet`, use `npm install -g @fnet/cli`.

## Core Concepts

### Nodes & Flows

**Nodes** are reusable functional units with explicit input/output schemas. Each Node has a deterministic, pure function at its core with clear I/O contracts. Think of them as the building blocks.

**Flows** orchestrate Nodes and sub-Flows into workflows. They define how capabilities connect, transform, and execute - composition and control flow over the primitives that Nodes provide.

|             | fnode Project                   | fnet Project          |
| ----------- | ------------------------------- | --------------------- |
| Config file | `fnode.yaml`                    | `fnet.yaml`           |
| Purpose     | Reusable Nodes, standalone apps | Workflow orchestration |
| CLI         | `fnode`                         | `fnet`                |
| Runtimes    | Node.js, Bun, Python            | Node.js, Bun          |

### Schema-First & Multi-Runtime

Flownet uses schema-first contracts (I/O schemas) to define clear expectations. This enables:

- **Multi-runtime portability**: Same Core logic deploys to Node.js, Bun, or Python
- **Deterministic behavior**: Clear contracts across different runtimes
- **Automatic validation**: Schemas drive type checking and validation

```text
my-project/
|- src/
|  |- index.js          # JavaScript (Node.js / Bun)
|  '- index.py          # Python
|- fnode.yaml
'- .workspace/           # Layers (managed by CLI, not your concern)
```

### Documentation That Never Lies

Flownet automatically generates BPMN 2.0 (Business Process Model and Notation) diagrams from your Flow definitions on every build. Your YAML is the single source of truth - diagrams are derived, never hand-maintained.

- **Developers** read YAML (code-like, version controlled)
- **Stakeholders** view BPMN (visual, business-friendly)
- **Tools** analyze BPMN (process mining, compliance)

This solves the eternal problem of documentation going stale. With Flownet, it can't - diagrams regenerate on every `fnet build`.

### AI-Native: MCP Integration

Every Flownet project can be exposed as an AI-compatible tool server via the [Model Context Protocol (MCP)](https://modelcontextprotocol.io). Both `fnode` and `fnet` projects support MCP mode with STDIO and HTTP transports:

```bash
# Expose as MCP tool for Claude Desktop or any AI assistant
fnode cli --cli-mode mcp

# Or over HTTP for remote AI integrations
fnet cli --cli-mode mcp --mcp-transport http --cli-port 3003
```

This means any Flownet project - a data processor, a CLI tool, a workflow - can become a tool that AI assistants discover, understand, and invoke. It's not a bolt-on feature; it's a first-class runtime mode alongside CLI, HTTP, WebSocket, and Pipeline modes.

## Quick Start

### Create a Project

```bash
# Node.js project (default runtime)
fnode create --name my-project

# Python project
fnode create --name my-project --runtime python

# Bun project
fnode create --name my-project --runtime bun

# Workflow project
fnet create --name my-workflow
```

### Quick Test Projects

Rapid prototyping without thinking about names:

```bash
fnode express --yes  # Creates fnode-1, fnode-2, fnode-3...
fnet express --yes   # Creates fnet-1, fnet-2, fnet-3...
```

### Build and Run

```bash
frun build                          # Run 'build' command group
fnode cli                           # Run as CLI
frun <command-group> [--ftag <tags>] # Execute command group with tags
frun list                           # List available command groups
```

## CLI Tools

### fnode - Node/Classic Projects

```bash
fnode create --name my-project       # Create a new project
fnode build                          # Build the project
fnode cli                            # Run as CLI
fnode cli --cli-mode http            # Run as HTTP server
fnode compile                        # Compile to binary
fnode install                        # Install compiled binary
```

**Passthrough commands** execute tools in the project's `.workspace` context:

```bash
fnode npm install lodash             # npm in workspace
fnode node script.js                 # node in workspace
fnode bun run dev                    # bun in workspace
fnode python script.py               # python in workspace
fnode cdk deploy                     # AWS CDK in workspace
fnode aws s3 ls                      # AWS CLI in workspace
```

**Runtime modes** - one project, multiple deployment targets:

| Mode      | Command                          | Use case                          |
| --------- | -------------------------------- | --------------------------------- |
| CLI       | `fnode cli`                      | Terminal executable               |
| HTTP      | `fnode cli --cli-mode http`      | REST API server                   |
| WebSocket | `fnode cli --cli-mode websocket` | Real-time bidirectional           |
| Pipeline  | `echo data \| fnode cli`         | Unix-style stdin/stdout streaming |
| MCP       | `fnode cli --cli-mode mcp`       | AI-compatible tool server         |

### fnet - Workflow Projects

```bash
fnet create --name my-workflow       # Create a workflow project
fnet build                           # Build (+ auto-generate BPMN)
fnet npm install                     # npm in workspace
fnet cdk deploy                      # AWS CDK in workspace
```

### frun - Unified Command Runner

Auto-detects project type and runs command groups. Powered by [`@fnet/shell-flow`](https://www.npmjs.com/package/@fnet/shell-flow).

```bash
frun build                           # Run 'build' command group
frun deploy                          # Run 'deploy' command group
frun dev --ftag local                # Run with tags
frun list                            # List available command groups
```

Define command groups in your project YAML:

```yaml
commands:
  build:
    usage: frun build
    description: Build the project
    steps:
      - npm install
      - npm run build

  test:
    usage: frun test
    description: Run all tests
    parallel:
      - npm run test:unit
      - npm run test:integration

  dev:
    usage: frun dev
    description: Start dev servers
    fork:
      - npm run watch:css
      - npm run watch:js
      - npm run dev-server
```

The `commands:` section is `@fnet/shell-flow` input schema in YAML format. This gives you sequential execution, parallel execution, background processes, environment variables, template variables (`{{var}}`), output capture, retry with exponential backoff, timeouts, and a full set of expression builtins (`json::`, `http::`, `file::`, `txt::`, `encode::`, `hash::`, `time::`, `capture::`, `pause::`, and more).

### fbin - Binary Management

Compile JavaScript to native binaries and manage installations:

```bash
fbin setup                           # Initialize the bin system
fbin path                            # Add ~/.fnet/bin to PATH
fbin compile script.js -o my-tool    # Compile JS to binary
fbin install ./my-tool --name app    # Install a binary
fbin list                            # List installed binaries
fbin uninstall app --yes             # Remove a binary
fbin backup                          # Backup binaries and shell config
fbin restore                         # Restore from backup
```

Pre-compiled binaries for all platforms are built via GitHub Actions and distributed through GitHub Releases.

### fservice - Service Management

Deploy projects as system services across platforms:

```bash
fservice manifest create             # Create a service definition
fservice register -d my-api          # Register with OS service manager
fservice start my-api                # Start service
fservice stop my-api                 # Stop service
fservice restart my-api              # Restart service
fservice status my-api               # Check status
fservice list                        # List all services
fservice unregister my-api           # Remove service
```

**Supported platforms**: macOS (launchd), Linux (systemd), Windows (Windows Services)

## Tag-Based Configuration

The `--ftag` parameter enables conditional configuration from a single project file:

```bash
frun build --ftag dev --ftag local
```

```yaml
name: my-project

database:
  port: 5432

t::dev::database:
  url: "mongodb://localhost:27017"

t::prod::database:
  url: "mongodb://production-server:27017"
```

One file, multiple environments. Tags enable environment-specific commands, feature flags, and platform-specific configurations.

## Project Structure

```text
my-project/
|- src/                  # Core - your code
|- fnode.yaml            # or fnet.yaml - project configuration
|- .workspace/           # Layers - managed by CLI
'- .fnet/                # Local configuration
```

**Global directories**:

- `~/.fnet/bin/` - Installed binaries
- `~/.fnet/services/` - Service definitions

## Comparison

| Aspect         | Traditional Workflow Engines | Flownet                           |
| -------------- | ---------------------------- | --------------------------------- |
| Syntax         | Proprietary DSL              | YAML + JavaScript                 |
| Development    | Special IDE required         | Any IDE (VS Code, etc.)           |
| Debugging      | Limited or proprietary       | Standard (Chrome DevTools)        |
| Testing        | Proprietary tools            | Standard test frameworks          |
| Visualization  | Manual diagram creation      | Auto-generated BPMN               |
| Runtime        | Vendor-specific              | Multi-runtime (Node/Bun/Python)   |
| Learning Curve | Steep (new DSL + tools)      | Gentle (YAML + JavaScript)        |
| Flexibility    | Opinionated, limited         | Primitives, compose freely        |
| Ecosystem      | Vendor packages              | npm ecosystem                     |
| AI Integration | Separate system              | Built-in MCP mode                 |

## License

MIT
