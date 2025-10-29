# @fnet/cli: Flownet CLI

<p align="center">
  <img src="https://raw.githubusercontent.com/fnetai/cli/main/assets/flownet-logo.png" alt="Flownet Logo" width="200"/>
</p>

<p align="center">
  <b>Focus on functional code, let Flownet handle the rest</b>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@fnet/cli"><img src="https://img.shields.io/npm/v/@fnet/cli.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@fnet/cli"><img src="https://img.shields.io/npm/dm/@fnet/cli.svg" alt="npm downloads"></a>
  <a href="https://github.com/fnetai/cli/blob/main/LICENSE"><img src="https://img.shields.io/github/license/fnetai/cli.svg" alt="license"></a>
</p>

## Overview

Flownet is a low-level flow framework that separates **Core** (your business logic) from **Layers** (infrastructure, dev, build, runtime, and delivery). This separation allows developers to focus on functional code while Flownet automates the surrounding infrastructure. The `@fnet/cli` package provides command-line tools to create, build, and manage Flownet projects.

Flownet provides primitives for composing workflows similar to how React provides components for UI development. It emphasizes a **schema-first approach** with **deterministic core**, enabling **multi-runtime portability**.

### Key Features

- **Core vs Layers Architecture**: Separate your business logic (Core) from infrastructure (Layers) for cleaner, more maintainable code
- **Nodes & Flows**: Reusable functional units (Nodes) with explicit I/O schemas, orchestrated by Flows
- **I/O Contracts**: Schema-first contracts define clear input/output expectations for deterministic behavior
- **Automatic Dependency Detection**: Simplified dependency management across your project
- **Multi-Runtime Support**: Deploy to Node.js, Bun, Deno, or Python - choose the best runtime for each task
- **Language Agnostic**: Support for multiple programming languages (JavaScript, Python) in the same project
- **Unified Interface**: Consistent commands across different project types
- **Tag-Based Configuration**: Powerful conditional configuration with `--ftag` parameter
- **Isolated Workspace**: All build artifacts and dependencies are kept in `.workspace` directory
- **Binary System**: Compile, install, and manage CLI tools with the integrated binary system
- **Project File Configuration**: Configure CLI features directly in your project files
- **Fast Startup**: Pre-compiled binaries start much faster than interpreted scripts

## Installation

```bash
# Using npm
npm install -g @fnet/cli

# Using yarn
yarn global add @fnet/cli

# Using bun
bun install -g @fnet/cli
```

## Quick Start

### Create a New Project

```bash
# Create a Node.js project
fnode create my-node-project

# Create a Python project
fnode create my-python-project --runtime python

# Create a Bun project
fnode create my-bun-project --runtime bun

# Create a workflow project
fnet create my-workflow-project
```

### Build and Run

```bash
# Build the project
frun build

# Run the project
fnode cli

# Execute a command group from project file
frun <command-group> [--ftag <tags>]
```

### Compile and Install

```bash
# Compile a JavaScript file to a binary
fbin compile script.js -o my-tool

# Install a compiled binary
fbin install ./my-tool --name awesome-tool

# Install a CLI-enabled project
cd my-project
fnode install --yes

# Or use npm scripts in your project
npm run compile
npm run install-bin

# List installed binaries
fbin list

# Uninstall a binary
fbin uninstall awesome-tool --yes
```

## Core Concepts

### Nodes & Flows

**Nodes** are reusable functional units that encapsulate business logic with explicit input/output schemas. Each Node:

- Has a deterministic, pure function at its core
- Defines clear I/O contracts (input and output schemas)
- Can be composed and reused across different Flows
- Supports automatic dependency detection

**Flows** orchestrate Nodes and sub-Flows to create complex workflows. Flows:

- Connect multiple Nodes with explicit data contracts
- Enable multi-runtime portability through schema-first design
- Support complex data transformations and conditional logic
- Maintain deterministic behavior across different runtimes

### I/O Contracts

Flownet uses schema-first contracts to define clear input and output expectations. This approach:

- Ensures deterministic behavior across different runtimes
- Enables automatic validation and type checking
- Facilitates multi-runtime portability
- Improves code clarity and maintainability

## Project Types

Flownet supports two main project types:

### fnode Project

An **fnode project** (Flow Node Project) is a classic/node-style project that focuses on creating reusable Nodes or standalone applications. These projects:

- Use `fnode.yaml` as their configuration file
- Typically contain a single code file in the `src` directory
- Can be built with different runtimes (Node.js, Python, Bun)
- Support multiple programming languages simultaneously
- Ideal for creating reusable components with explicit I/O contracts

### fnet Project

An **fnet project** (Flow Project) is a workflow-oriented project that focuses on orchestrating multiple Nodes and Flows. These projects:

- Use `fnet.yaml` as their configuration file
- Define workflows that connect multiple Nodes and sub-Flows
- Support complex data flows and transformations
- Enable multi-runtime deployment strategies
- Ideal for building complex business logic orchestrations

## CLI Tools

Flownet provides five main CLI tools:

- **`fnode`**: For Node/classic projects (uses `fnode.yaml`) - create and manage reusable Nodes
- **`fnet`**: For Workflow projects (uses `fnet.yaml`) - create and manage Flows that orchestrate Nodes
- **`frun`**: Unified interface that works with both project types (auto-detects project file)
- **`fbin`**: Binary management system for installing, compiling, and managing CLI tools
- **`fservice`**: Service management for deploying and running Flownet applications

## Multi-Language & Multi-Runtime Support

Flownet supports multiple programming languages and runtimes simultaneously within the same project:

```text
my-project/
├── src/
│   ├── index.js          # JavaScript implementation (used by Node.js and Bun)
│   └── index.py          # Python implementation
├── fnode.yaml            # Project configuration file
└── .workspace/           # Build infrastructure (managed by CLI)
```

### Supported Runtimes

- **Node.js**: JavaScript/TypeScript execution with full npm ecosystem support
- **Bun**: Fast JavaScript runtime with improved performance
- **Deno**: Secure JavaScript/TypeScript runtime with built-in tooling
- **Python**: Python 3.x for data processing and scientific computing

### Multi-Runtime Portability

Thanks to Flownet's schema-first approach and deterministic core:

- Write your core logic once and deploy to multiple runtimes
- Choose the best runtime for each specific use case
- Migrate between runtimes without changing your business logic
- Use JavaScript with Node.js for quick development, Python for data processing, and Bun for improved performance

## Tag-Based Configuration

Both CLI tools support the `--ftag` parameter for powerful conditional configuration:

```bash
frun build --ftag dev --ftag local
```

This activates sections in your project file marked with `t::dev::` or `t::local::` tags:

```yaml
# Base configuration
name: my-project

# Development environment configuration
t::dev::database:
  url: "mongodb://localhost:27017"

# Production environment configuration
t::prod::database:
  url: "mongodb://production-server:27017"
```

## Binary System

Flownet includes a powerful binary system that makes it easy to create, distribute, and manage CLI tools:

### Binary System Features

- **Fast Startup**: Pre-compiled binaries start much faster than interpreted scripts
- **Cross-Platform Support**: Works on macOS, Linux, and Windows
- **Multiple Shell Support**: Compatible with Bash, Zsh, Fish, PowerShell, and more
- **Version Management**: Keeps track of binary versions and metadata
- **Project Integration**: Easily compile and install CLI-enabled projects
- **Automation Support**: All commands support the `--yes` flag for scripting

### Setup and Usage

```bash
# Initialize the bin system
fbin setup

# Add bin directory to PATH
fbin path

# Compile a JavaScript file to a binary
fbin compile script.js -o my-tool

# Install a binary to the bin directory
fbin install ./my-tool --name awesome-tool

# List installed binaries
fbin list

# Uninstall a binary
fbin uninstall awesome-tool
```

### Project Integration

The binary system integrates seamlessly with Flownet projects:

```bash
# Compile and install a CLI-enabled fnode project
fnode compile
fnode install

# Compile and install a CLI-enabled fnet project
fnet compile
fnet install

# Using npm scripts in your project
npm run compile
npm run install-bin
```

This makes it easy to distribute your Flownet projects as standalone CLI tools.

### CLI Configuration in Project Files

You can configure CLI features directly in your project files:

```yaml
# In fnode.yaml or fnet.yaml
name: my-project

features:
  # For fnode projects
  s::runtime.type: node  # or python, bun

  # CLI configuration
  cli:
    enabled: true
    bin: custom-bin-name  # Name of the binary (defaults to project name)
    installable: true     # Enable 'fnode install' or 'fnet install' command
```

This configuration will:

1. Enable CLI functionality for your project
2. Set the binary name to `custom-bin-name`
3. Add `compile` and `install-bin` scripts to your package.json
4. Allow you to install the binary with `fnode install` or `npm run install-bin`
