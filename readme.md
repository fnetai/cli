# @fnet/cli: Flownet CLI Tools

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

- **Language Agnostic**: Support for multiple programming languages (JavaScript, Python, Go, Rust, C) in the same project
- **Runtime Flexibility**: Choose the best runtime for each task (Node.js, Python, Bun)
- **Unified Interface**: Consistent commands across different project types
- **Tag-Based Configuration**: Powerful conditional configuration with `--ftag` parameter
- **Isolated Workspace**: All build artifacts and dependencies are kept in `.workspace` directory

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

Flownet provides three main CLI tools:

- **`fnode`**: For Node/classic projects (uses `fnode.yaml`)
- **`fnet`**: For Workflow projects (uses `fnet.yaml`)
- **`frun`**: Unified interface that works with both project types (auto-detects project file)

## Multi-Language Support

Flownet is evolving to support multiple programming languages simultaneously within the same project:

```text
my-project/
├── src/
│   ├── index.js          # JavaScript implementation
│   ├── index.python      # Python implementation
│   ├── index.go          # Go implementation
│   ├── index.rs          # Rust implementation
│   └── index.c           # C implementation
├── fnode.yaml            # Project configuration file
└── .workspace/           # Build infrastructure (managed by CLI)
```

This allows you to:

- Write your core logic once and migrate it to other languages as needed
- Choose the best language for each specific use case
- Start with one language for rapid prototyping, then migrate performance-critical parts to more efficient languages

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
