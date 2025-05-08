# Research: @fnet/shell-flow Package Analysis

## Overview

This research document examines the @fnet/shell-flow npm package and its relevance to Flownet CLI. The package provides command execution and shell operation capabilities for Flownet projects, enabling structured and controlled execution of shell commands and command groups. It serves as the backbone for the command execution system in Flownet CLI, allowing for sophisticated command orchestration with features like sequential execution, parallel processing, error handling, and environment variable management.

## Details

### Package Purpose and Functionality

The @fnet/shell-flow package serves as a command execution engine for Flownet CLI projects. Its primary purpose is to provide a structured, declarative approach to running shell commands and command groups, abstracting away the complexities of process management, error handling, and output capture.

The package builds upon Node.js's child process capabilities but adds several layers of functionality:

- **Command Group Orchestration**: Manages the execution of complex command sequences
- **Process Control**: Handles process spawning, monitoring, and termination
- **Output Management**: Captures and processes command outputs
- **Error Handling**: Provides sophisticated error handling mechanisms
- **Environment Variable Management**: Controls environment variables for command execution
- **Context Injection**: Allows passing context data to commands

At its core, @fnet/shell-flow transforms declarative command definitions (in YAML or JavaScript objects) into executable processes, handling all the low-level details of process management while providing a high-level API for developers.

### Key Features

1. **Flexible Command Definition**
   - Supports both simple string commands and complex command objects
   - Allows defining command groups with multiple steps
   - Example:

     ```javascript
     await fnetShellFlow({
       commands: [
         "echo 'Hello World'",
         { command: "npm install", cwd: "./project" }
       ]
     });
     ```

2. **Command Group Structures**
   - **Sequential Execution**: Run commands one after another
   - **Parallel Execution**: Run multiple commands simultaneously
   - **Forked Execution**: Run commands in the background
   - Example:

     ```yaml
     commands:
       build:
         - "echo 'Starting build'"
         - parallel:
             - "npm run test:unit"
             - "npm run test:integration"
         - "npm run build"
     ```

3. **Error Handling**
   - Configurable error behavior (stop, continue, ignore)
   - Error capture and reporting
   - Custom error handlers
   - Example:

     ```yaml
     commands:
       deploy:
         - steps:
             - "npm run test"
             - "npm run build"
           onError: "stop"
     ```

4. **Output Capture**
   - Capture command output for further processing
   - Named output capture for reference in subsequent commands
   - Example:

     ```yaml
     commands:
       version:
         - command: "npm version"
           captureName: "version_info"
         - echo: "Version info: {{version_info}}"
     ```

5. **Environment Variable Control**
   - Set environment variables for specific commands or groups
   - Inherit or override parent environment
   - Example:

     ```yaml
     commands:
       build:
         - command: "npm run build"
           env:
             NODE_ENV: "production"
     ```

6. **Command Templating**
   - Use template variables in commands
   - Access context data and previous command outputs
   - Example:

     ```yaml
     commands:
       greet:
         - echo: "Hello, {{username}}!"
         context:
           username: "developer"
     ```

7. **Special Command Types**
   - Built-in commands like `echo`, `sleep`, `exit`
   - Conditional execution with `if` statements
   - Example:

     ```yaml
     commands:
       wait:
         - echo: "Waiting for 2 seconds..."
         - sleep: 2
         - echo: "Done waiting!"
     ```

### Integration with Flownet CLI

The @fnet/shell-flow package is deeply integrated into the Flownet CLI ecosystem:

1. **Command Group Execution**
   - Powers the `frun` command for executing command groups from project files
   - Used in both `fnode` and `fnet` CLI tools
   - Example from codebase:

     ```javascript
     await fnetShellFlow({
       commands: commandGroup,
       context: {
         args,
         argv,
         projectType: projectFile.type
       }
     });
     ```

2. **Project Configuration**
   - Command groups are defined in project configuration files (`fnode.yaml`, `fnet.yaml`)
   - Provides the execution engine for these command definitions
   - Example from `fnet.yaml`:

     ```yaml
     # @fnet/shell-flow commands
     commands:
       build:
         - bun run build
         - bun ./dist/fnode/index.js --version
         - bun ./dist/fnet/index.js --version
         - bun ./dist/frun/index.js --version
         - bun ./dist/fbin/index.js --version
         - bun link
     ```

3. **Deployment Processes**
   - Used in deployment modules for executing deployment steps
   - Provides structured execution for complex deployment sequences

4. **Development Workflows**
   - Powers development workflows like building, testing, and running
   - Enables consistent command execution across different environments

### Relationship with Other Flownet Packages

The @fnet/shell-flow package interacts with several other Flownet packages:

1. **@fnet/args**
   - Dependency relationship for command-line argument parsing
   - Used to process arguments passed to commands

2. **@fnet/filemap**
   - Dependency for file mapping operations
   - Used for handling file-related operations in commands

3. **@fnet/yaml and @fnet/config**
   - Complementary relationship for configuration management
   - Command groups defined in YAML are processed by @fnet/yaml and then executed by @fnet/shell-flow

4. **@fnet/auto-conda-env**
   - Uses @fnet/shell-flow for executing conda environment setup commands
   - Example of how @fnet/shell-flow serves as a foundation for other packages

### Usage Patterns

Common usage patterns for the @fnet/shell-flow package include:

1. **Basic Command Execution**

   ```javascript
   import fnetShellFlow from '@fnet/shell-flow';

   await fnetShellFlow({
     commands: "echo 'Hello World'"
   });
   ```

2. **Command Group Execution**

   ```javascript
   await fnetShellFlow({
     commands: [
       "echo 'Step 1'",
       "echo 'Step 2'",
       "echo 'Step 3'"
     ]
   });
   ```

3. **Complex Command Structures**

   ```javascript
   await fnetShellFlow({
     commands: {
       steps: [
         "npm install",
         {
           parallel: [
             "npm run test:unit",
             "npm run test:integration"
           ]
         },
         "npm run build"
       ],
       onError: "stop"
     }
   });
   ```

4. **Context-Aware Commands**

   ```javascript
   await fnetShellFlow({
     commands: [
       "echo 'Building {{projectName}}'",
       "cd {{projectDir}} && npm run build"
     ],
     context: {
       projectName: "My Project",
       projectDir: "./projects/my-project"
     }
   });
   ```

5. **Output Capture and Reuse**

   ```javascript
   await fnetShellFlow({
     commands: [
       {
         command: "git rev-parse --short HEAD",
         captureName: "commit_hash"
       },
       "echo 'Current commit: {{commit_hash}}'"
     ]
   });
   ```

### Limitations and Considerations

1. **Platform Dependencies**
   - Some commands may behave differently across operating systems
   - Shell-specific syntax may not be portable

2. **Error Propagation**
   - Complex error handling may be difficult to debug
   - Error messages from deeply nested commands may be obscured

3. **Performance Overhead**
   - Additional abstraction layer adds some performance overhead
   - Parallel execution may be resource-intensive

4. **Security Considerations**
   - Command injection risks when using template variables
   - Careful validation needed for user-provided command inputs

5. **Debugging Complexity**
   - Debugging complex command structures can be challenging
   - May require additional logging or debugging tools

### Implementation Recommendations

1. **Standardized Command Structure**
   - Establish consistent patterns for command group definitions
   - Use named command groups for better organization
   - Example:

     ```yaml
     commands:
       # Development commands
       dev:
         - npm run dev

       # Build commands
       build:
         - npm run build

       # Test commands
       test:
         - npm run test
     ```

2. **Error Handling Strategy**
   - Define clear error handling policies for different command types
   - Use appropriate error behaviors based on command criticality
   - Example:

     ```yaml
     commands:
       deploy:
         # Critical steps that must succeed
         - steps:
             - "npm run test"
             - "npm run build"
           onError: "stop"

         # Non-critical steps that can fail
         - steps:
             - "npm run docs"
             - "npm run cleanup"
           onError: "continue"
     ```

3. **Context Management**
   - Use consistent context variables across commands
   - Document context variables for better maintainability
   - Example:

     ```yaml
     commands:
       build:
         - echo: "Building {{projectName}} version {{version}}"
         - npm run build
       context:
         projectName: "My Project"
         version: "1.0.0"
     ```

4. **Output Capture Guidelines**
   - Establish naming conventions for captured outputs
   - Use captured outputs judiciously to avoid complexity
   - Example:

     ```yaml
     commands:
       version:
         - command: "npm version"
           captureName: "npm_version_info"
         - command: "node --version"
           captureName: "node_version_info"
     ```

5. **Testing and Validation**
   - Test command groups in isolation before integration
   - Validate command definitions against a schema
   - Consider dry-run capabilities for testing

## References

- NPM Package: [@fnet/shell-flow](https://www.npmjs.com/package/@fnet/shell-flow)
- Dependencies:
  - [@fnet/args](https://www.npmjs.com/package/@fnet/args)
  - [@fnet/filemap](https://www.npmjs.com/package/@fnet/filemap)
  - [nanoid](https://www.npmjs.com/package/nanoid)
  - [tree-kill](https://www.npmjs.com/package/tree-kill)
- [Related Phase: Phase 003 @fnet/shell-flow Package Analysis](../phases/phase-003.md)
- [Related Documentation: Flownet CLI](../flownet.md)
