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

Flownet is a revolutionary development framework that isolates non-functional components, allowing developers to focus solely on functional code. The `@fnet/cli` package provides command-line tools to create, build, and manage Flownet projects.

### Key Features

- **Language Agnostic**: Support for multiple programming languages (JavaScript, Python) in the same project
- **Runtime Flexibility**: Choose the best runtime for each task (Node.js, Python, Bun)
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

## Project Types

Flownet supports two main project types:

### fnode Project

An **fnode project** (Flow Node Project) is a classic/node-style project that focuses on creating reusable components or standalone applications. These projects:

- Use `fnode.yaml` as their configuration file
- Typically contain a single code file in the `src` directory
- Can be built with different runtimes (Node.js, Python, Bun)
- Support multiple programming languages simultaneously

### fnet Project

An **fnet project** (Flow Project) is a workflow-oriented project that focuses on orchestrating multiple components. These projects:

- Use `fnet.yaml` as their configuration file
- Define workflows that connect multiple components
- Support complex data flows and transformations

## CLI Tools

Flownet provides four main CLI tools:

- **`fnode`**: For Node/classic projects (uses `fnode.yaml`)
- **`fnet`**: For Workflow projects (uses `fnet.yaml`)
- **`frun`**: Unified interface that works with both project types (auto-detects project file)
- **`fbin`**: Binary management system for installing, compiling, and managing CLI tools

## Multi-Language Support

Flownet supports multiple programming languages simultaneously within the same project:

```text
my-project/
├── src/
│   ├── index.js          # JavaScript implementation (used by both Node.js and Bun)
│   └── index.py          # Python implementation
├── fnode.yaml            # Project configuration file
└── .workspace/           # Build infrastructure (managed by CLI)
```

This allows you to:

- Write your core logic once and migrate it to other languages as needed
- Choose the best language for each specific use case
- Use JavaScript with Node.js for quick development, Python for data processing, and JavaScript with Bun for improved performance

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
