# Research: Flownet CLI Entry Points Analysis

## Overview

This research document examines the CLI entry points provided by the Flownet CLI project when published. The Flownet CLI ecosystem consists of multiple command-line tools that work together to provide a comprehensive development experience for different types of projects. This analysis focuses on identifying these entry points, understanding their functionality, and examining how they interact with each other.

## Details

### CLI Entry Points

The Flownet CLI project provides **four distinct CLI entry points** when published:

1. **fnode**: CLI tool for managing Node/classic projects
2. **fnet**: CLI tool for managing Workflow projects
3. **frun**: CLI tool for running command groups from project files
4. **fbin**: CLI tool for managing binaries

These entry points are defined in the `bin` field of the package.json file:

```json
"bin": {
  "fnet": "dist/fnet/index.js",
  "fnode": "dist/fnode/index.js",
  "frun": "dist/frun/index.js",
  "fbin": "dist/fbin/index.js"
}
```

When the @fnet/cli package is installed globally (via npm, yarn, or bun), these four commands become available in the user's PATH.

### Purpose and Functionality

#### 1. fnode

The `fnode` CLI tool is designed for managing Node/classic projects that use `fnode.yaml` as their project configuration file.

**Key functionality**:
- Project creation and management
- Building and deployment
- File and input management
- Command execution in project context
- Runtime-specific commands (Node.js, Python, Bun)
- Express project management

**Command structure**:
```
fnode <command> [options]
```

**Main commands**:
- `create`: Create a new fnode project
- `project`: Manage fnode project
- `build`: Build fnode project
- `deploy`: Build and deploy fnode project
- `file`: Create files
- `input`: Create or modify an input config file
- `install`: Install the project as a binary
- `run`: Run a command group
- `with`: Run a command with a config context
- `express`: Create and manage express projects
- Pass-through commands: `npm`, `node`, `bun`, `serve`, `watch`, `app`, `cli`, `compile`, `npx`, `cdk`, `aws`, `python`, `python3`, `pip`, `pip3`

#### 2. fnet

The `fnet` CLI tool is designed for managing Workflow projects that use `fnet.yaml` as their project configuration file.

**Key functionality**:
- Workflow project creation and management
- Building and deployment
- File and input management
- Command execution in project context

**Command structure**:
```
fnet <command> [options]
```

**Main commands**:
- `create`: Create a new fnet project
- `project`: Manage fnet project
- `build`: Build fnet project
- `deploy`: Build and deploy fnet project
- `file`: Create files
- `input`: Create or modify an input config file
- `install`: Install the project as a binary
- `run`: Run a command group
- `with`: Run a command with a config context
- `express`: Create and manage express projects
- Pass-through commands: `npm`, `node`, `bun`, `serve`, `watch`, `app`, `cli`, `compile`, `npx`, `cdk`, `aws`

#### 3. frun

The `frun` CLI tool provides a unified interface for running command groups from project files. It works with both `fnode.yaml` and `fnet.yaml` project files.

**Key functionality**:
- Execute command groups defined in project files
- Auto-detect project type (fnode or fnet)
- Support for conditional execution with tags

**Command structure**:
```
frun <command-group> [options]
```

**Main commands**:
- Default command: Run a command group from project file

#### 4. fbin

The `fbin` CLI tool manages the binary system for installing, compiling, and distributing CLI tools.

**Key functionality**:
- Compile JavaScript files to standalone binaries
- Install binaries to a central location
- Manage binary versions and metadata
- Add binary directory to PATH

**Command structure**:
```
fbin <command> [options]
```

**Main commands**:
- `setup`: Set up the binary system
- `path`: Manage the binary directory in PATH
- `compile`: Compile a JavaScript file to a binary
- `install`: Install a binary to the bin directory
- `uninstall`: Uninstall a binary
- `list`: List installed binaries

### Integration and Interaction

The four CLI tools are designed to work together as part of a cohesive ecosystem:

1. **Project Creation and Management**:
   - `fnode create` and `fnet create` create different types of projects
   - Projects can be managed with their respective CLI tools

2. **Command Execution**:
   - `frun` provides a unified interface for running commands from both project types
   - `fnode run` and `fnet run` are project-specific alternatives

3. **Binary Management**:
   - Projects created with `fnode` or `fnet` can be compiled and installed as binaries using `fbin`
   - The `install` command in both `fnode` and `fnet` uses `fbin` under the hood

4. **Development Workflow**:
   - Create a project with `fnode` or `fnet`
   - Develop using project-specific commands
   - Run command groups with `frun`
   - Compile and distribute as a binary with `fbin`

### CLI Modes

Flownet projects can be run in different modes using the `--cli-mode` parameter:

1. **Default Mode**: Runs the functional code directly
   ```
   fnode cli --param1 value1 --param2 value2
   ```

2. **MCP Mode**: Runs the functional code as an MCP (Model Context Protocol) server
   ```
   fnode cli --cli-mode=mcp
   ```

3. **HTTP Mode**: Runs the functional code as an HTTP server
   ```
   fnode cli --cli-mode=http
   ```

### Project Templates and CLI Integration

The Flownet CLI project provides templates for creating new projects with CLI capabilities:

1. **CLI Entry Point**: Projects are created with a `src/cli/index.js` file that serves as the entry point
2. **Package.json Configuration**: CLI-enabled projects have a `bin` field in their package.json
3. **Compilation Support**: Projects include npm scripts for compiling and installing as binaries

Example from a template:
```json
"scripts": {
  "compile": "fbin compile {{atom.doc.features.cli.dir}}/index.js -o .bin/{{atom.doc['npm::bin'] or atom.doc['name'] or atom['id']}}",
  "install-bin": "fbin install ./.bin/{{atom.doc['npm::bin'] or atom.doc['name'] or atom['id']}} --yes"
},
"bin": {
  "{{atom.doc['npm::bin']}}": "{{atom.doc.features.cli.dir}}/index.js"
}
```

### Implementation Details

1. **Entry Point Structure**:
   - Each CLI tool has its own directory in the `src` folder (e.g., `src/fnode-cli`)
   - The main entry point is `index.js` in each directory
   - Backward compatibility files (e.g., `fnode-cli.js`) redirect to the main entry point

2. **Command Handling**:
   - Commands are implemented as separate modules (e.g., `create-cmd.js`)
   - The yargs library is used for command-line argument parsing
   - Common utilities are shared across CLI tools

3. **Build Process**:
   - The Rollup bundler is used to build the CLI tools
   - The build output is placed in the `dist` directory
   - The package.json `bin` field points to these built files

4. **Cross-Platform Support**:
   - The CLI tools are designed to work on macOS, Linux, and Windows
   - Platform-specific behavior is handled in the code

## Recommendations

1. **Consistent Command Structure**:
   - Maintain a consistent command structure across all CLI tools
   - Use similar option names and formats for better user experience

2. **Documentation**:
   - Provide clear documentation for each CLI tool and its commands
   - Include examples and use cases

3. **Cross-Tool Functionality**:
   - Consider adding more cross-tool functionality to enhance the ecosystem
   - Implement shared utilities for common tasks

4. **Error Handling**:
   - Implement comprehensive error handling
   - Provide helpful error messages and suggestions

5. **Backward Compatibility**:
   - Ensure backward compatibility when making changes to the CLI tools
   - Provide migration paths for users

6. **Testing**:
   - Implement thorough testing for all CLI tools
   - Include integration tests for the entire ecosystem

## References

- Package.json: [package.json](../../package.json)
- fnode CLI: [src/fnode-cli/index.js](../../src/fnode-cli/index.js)
- fnet CLI: [src/fnet-cli/index.js](../../src/fnet-cli/index.js)
- frun CLI: [src/frun-cli/index.js](../../src/frun-cli/index.js)
- fbin CLI: [src/fbin-cli/index.js](../../src/fbin-cli/index.js)
- Documentation: [docs/flownet.md](../../docs/flownet.md)
- [Related Phase: Phase 005 Flownet CLI Entry Points Analysis](../phases/phase-005.md)
