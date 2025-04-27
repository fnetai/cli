# Bin System Implementation Plan for @fnet/cli

## 1. Overview

The goal is to implement a binary system for @fnet/cli that allows compiled binaries (especially those compiled with Bun) to be stored in a user-specific directory. This will improve performance for CLI projects by providing pre-compiled binaries that can be executed directly, eliminating the need to interpret JavaScript code each time.

## 2. Current Structure

Currently, the codebase:

- Uses JavaScript/TypeScript files that are interpreted at runtime
- Relies on npm/bun global installations for CLI commands
- Does not have a dedicated binary storage system
- Requires recompilation or interpretation for each execution

## 3. Proposed Structure

### 3.1. Bin Directory

- `~/.fnet/bin/`: User-specific directory for storing compiled binaries
- Added to the user's PATH for direct execution from anywhere

### 3.2. Binary Naming Convention

- `<project-name>`: Base name from the project
- `<project-name>@<version>`: Version-specific binary
- Platform-specific suffixes for cross-platform support

### 3.3. Command Structure

- `fbin` command with its own entry file (`bin-cli.js`) for managing the bin system
- Completely separate from other CLI tools (fnet, fnode, frun)
- Well-structured file hierarchy to keep the codebase organized

## 4. Implementation Phases

### Phase 1: Setup and Infrastructure

1. Create `fbin` command with its own entry file
2. Implement `fbin setup` command to:
   - Create `~/.fnet/bin/` directory if it doesn't exist
   - Register the bin directory in the user's PATH for different shells
   - Create metadata storage structure
   - Validate the setup is working correctly

### Phase 2: Node Project Compilation

1. Add compile option to Node project templates (fnode/node and fnet/node)
2. Implement direct command-line compilation for CLI-enabled projects
   - Add `fnode compile` command as a shortcut for Node projects
   - Add `fnet compile` command as a shortcut for Flow projects
3. Focus on compiling the bundled CLI output (dist/cli/esm/index.js)
4. Test compiled binaries for proper functionality
5. Ensure cross-platform compatibility of compiled binaries

### Phase 3: Bin System Compilation Integration

1. Add `compile` command to `fbin` CLI
2. Update Node project templates to use `fbin compile` in package.json
3. Create a more platform-independent and flexible compilation mechanism
4. Test the integration with different project types

## 5. Benefits

1. **Performance**: Significantly faster execution of CLI tools
2. **Convenience**: Easy access to compiled binaries from anywhere
3. **Versioning**: Support for multiple versions of the same tool
4. **Distribution**: Simplified distribution of CLI tools
5. **Offline Use**: Binaries work without requiring npm/bun at runtime

## 6. Potential Challenges

1. **Cross-Platform Support**: Ensuring binaries work across different operating systems
2. **Dependencies**: Managing external dependencies for compiled binaries
3. **PATH Management**: Correctly adding and maintaining the bin directory in PATH
4. **Updates**: Handling updates and version conflicts
5. **Size Management**: Preventing the bin directory from growing too large

## 7. Implementation Details

### 7.1. Project File Structure

```bash
src/
  ├── bin/                  # Bin system specific files
  │   ├── bin-cli.js        # Main entry point for fbin command
  │   ├── bin-setup.js      # Setup functionality
  │   ├── bin-install.js    # Binary installation functionality
  │   ├── bin-list.js       # Binary listing functionality
  │   ├── bin-uninstall.js  # Binary uninstallation functionality
  │   └── bin-utils.js      # Common utilities for bin system
  └── utils/
      └── bin-system.js     # Core bin system functionality
```

### 7.2. Bin Directory Structure

```bash
~/.fnet/
  ├── bin/                  # Binary executables
  │   ├── project1          # Latest version of project1
  │   ├── project1@1.0.0    # Specific version of project1
  │   └── project2          # Latest version of project2
  └── metadata/             # Metadata for bin management
      └── binaries.json     # Registry of installed binaries
```

### 7.3. Phase 1 Implementation Details

Phase 1 implementation will focus on setting up the basic infrastructure for the bin system. This includes:

1. Creating the necessary directory structure
2. Setting up the PATH registration
3. Implementing the core utilities for bin system management

All user interactions will use the `@fnet/prompt` library to provide a consistent and user-friendly experience. This will allow users to make informed decisions during the setup process and provide clear feedback on the actions being taken.

The implementation will be modular and well-structured, with separate files for different components of the system:

- `bin-cli.js`: Main entry point for the `fbin` command
- `bin-setup.js`: Implementation of the `setup` command
- `bin-path.js`: Implementation of the `path` command
- `bin-system.js`: Core utilities for bin system management

This structure will make it easy to extend the system in future phases while maintaining a clean and organized codebase.

### 7.4. Future Phases Overview

In future phases, we will implement:

- Binary compilation and installation
- Binary management (list, update, uninstall)
- Integration with build and deploy commands

These features will build on the foundation established in Phase 1.

## 8. Migration Strategy

1. Implement the bin system as an optional feature first
2. Add the `--bin` flag to existing commands without changing default behavior
3. Test thoroughly with different project types and platforms
4. Gradually encourage users to adopt the bin system through documentation
5. Consider making it the default in a future major version

## 9. Timeline

1. Phase 1: Setup and Infrastructure (1-2 days)
   - Create project file structure
   - Implement `fbin setup` command
   - Implement `fbin path` command
   - Update build configuration

2. Phase 2: Node Project Compilation (2-3 days)
   - Add compile option to Node project templates
   - Implement `fnode compile` and `fnet compile` commands
   - Test compiled binaries for functionality

3. Phase 3: Bin System Compilation Integration (1-2 days)
   - Add `compile` command to `fbin` CLI
   - Update Node project templates to use `fbin compile`
   - Create a more platform-independent compilation mechanism

4. Phase 4: Multi-Platform Support and Testing (2-3 days)
   - Ensure all `fbin` commands work on multiple platforms
   - Add platform-specific code paths where necessary
   - Test on different operating systems (Windows, macOS, Linux)
   - Fix bugs and edge cases
   - Document platform-specific considerations

5. Phase 5: Binary Management Commands (1-2 days)
   - Add `fbin install` command for installing binaries to bin directory
   - Add `fbin uninstall` command for removing binaries from bin directory
   - Add `fbin list` command for listing installed binaries
   - Add `fnode install` and `fnet install` commands for CLI-enabled projects
   - Update documentation and examples

Total estimated time: 7-12 days

## 10. Implementation Checklists

### 10.1. Phase 1 Checklist (Completed)

The following checklist for Phase 1 (Setup and Infrastructure) has been completed:

- [x] Create project file structure
  - [x] Create `src/bin` directory
  - [x] Create `bin-cli.js` entry point
  - [x] Create `bin-setup.js` for setup command
  - [x] Create `bin-system.js` for core functionality

- [x] Implement `fbin setup` command
  - [x] Create `~/.fnet/bin/` directory
  - [x] Create metadata storage structure
  - [x] Detect shell type (bash, zsh, fish, powershell, and more)
  - [x] Check if bin directory is in PATH
  - [x] Provide instructions for adding to PATH

- [x] Implement `fbin path` command
  - [x] Add bin directory to PATH for different shells
    - [x] Bash support
    - [x] Zsh support
    - [x] Fish support
    - [x] PowerShell support
    - [x] PowerShell Core support
    - [x] CMD support
    - [x] Ksh support
    - [x] Csh/Tcsh support

- [x] Update build configuration
  - [x] Update rollup.config.mjs to build fbin
  - [x] Update package.json to include fbin in bin section

- [x] Test Phase 1 implementation
  - [x] Test `fbin setup` command
  - [x] Test `fbin path` command
  - [x] Verify bin directory structure is created correctly

### 10.2. Phase 2 Checklist (Completed)

The following checklist for Phase 2 (Node Project Compilation) has been completed:

- [x] Analyze Node project templates
  - [x] Understand the structure of fnode/node template
  - [x] Understand the structure of fnet/node template
  - [x] Identify the CLI output path (dist/cli/esm/index.js)

- [x] Add compile option to Node project templates
  - [x] Update package.json.njk in fnode/node template
  - [x] Update package.json.njk in fnet/node template
  - [x] Add compile script that uses Bun's build command

- [x] Implement command-line compilation
  - [x] Add `fnode compile` command as a shortcut for Node projects
  - [x] Add `fnet compile` command as a shortcut for Flow projects
  - [x] Ensure the commands work with CLI-enabled projects
  - [x] Set proper permissions for compiled binaries

- [x] Test compiled binaries
  - [x] Test on macOS (other platforms will be tested in future phases)
  - [x] Verify that compiled binaries run correctly
  - [x] Compare performance with non-compiled versions

- [x] Documentation
  - [x] Document the compile option in project templates
  - [x] Provide usage examples
  - [x] Update the main documentation

### 10.3. Phase 3 Checklist (Completed)

The following checklist for Phase 3 (Bin System Compilation Integration) has been completed:

- [x] Add `compile` command to `fbin` CLI
  - [x] Create bin-compile.js for the compile command
  - [x] Implement platform detection for appropriate compilation
  - [x] Add support for different output formats and options

- [x] Update Node project templates to use `fbin compile`
  - [x] Update package.json.njk in fnode/node template
  - [x] Update package.json.njk in fnet/node template
  - [x] Ensure backward compatibility with existing projects

- [x] Create a more platform-independent compilation mechanism
  - [x] Handle different operating systems appropriately
  - [x] Support various compilation options
  - [x] Implement error handling and reporting

- [x] Test the integration with different project types
  - [x] Test with fnode/node projects
  - [x] Test with fnet/node projects
  - [x] Test on macOS (other platforms will be tested in future phases)

- [x] Documentation
  - [x] Document the `fbin compile` command and its options
  - [x] Update template documentation
  - [x] Provide usage examples

### 10.4. Phase 4 Checklist (Completed)

The following checklist for Phase 4 (Multi-Platform Support and Testing) has been completed:

- [x] Ensure all `fbin` commands work on multiple platforms
  - [x] Review and update `bin-setup.js` for cross-platform compatibility
  - [x] Review and update `bin-path.js` for cross-platform compatibility
  - [x] Review and update `bin-compile.js` for cross-platform compatibility
  - [x] Add platform-specific code paths where necessary

- [x] Test on different operating systems
  - [x] Test on macOS
  - [x] Document any platform-specific issues or limitations
  - [x] Add platform detection and handling

- [x] Fix bugs and edge cases
  - [x] Handle path separators correctly (/ vs \)
  - [x] Handle file permissions correctly
  - [x] Handle different terminal environments
  - [x] Ensure proper error handling across platforms

- [x] Update documentation
  - [x] Document platform-specific considerations
  - [x] Add platform-specific notes to command outputs
  - [x] Provide troubleshooting guidance for common issues

### 10.5. Phase 5 Checklist (Completed)

The following checklist for Phase 5 (Binary Management Commands) has been completed:

- [x] Add `fbin install` command
  - [x] Create bin-install.js for the install command
  - [x] Implement binary installation from local file to bin directory
  - [x] Add support for versioning and metadata
  - [x] Handle conflicts with existing binaries

- [x] Add `fbin uninstall` command
  - [x] Create bin-uninstall.js for the uninstall command
  - [x] Implement binary removal from bin directory
  - [x] Update metadata after removal
  - [x] Add confirmation prompt for safety

- [x] Add `fbin list` command
  - [x] Create bin-list.js for the list command
  - [x] Implement listing of installed binaries
  - [x] Show binary details (version, installation date, source)
  - [x] Add filtering options

- [x] Add `fnode install` and `fnet install` commands
  - [x] Update wf-cli.js to add install command to fnet
  - [x] Update lib-cli.js to add install command to fnode
  - [x] Ensure the commands work with CLI-enabled projects
  - [x] Add appropriate error handling and feedback

- [x] Update documentation
  - [x] Document the new commands and their options
  - [x] Provide usage examples
  - [x] Update the main documentation

### 10.6. Test Commands for Phase 2, Phase 3, Phase 4, and Phase 5

The following commands have been added to `fnet.yaml` for testing Phase 2, Phase 3, Phase 4, and Phase 5 implementations:

```yaml
# Test commands for Phase 2, Phase 3, Phase 4, and Phase 5
test-fnode-compile:
  - rm -rf .tests/fnode-node-compile
  - wdir: .tests
    steps:
      - fnode create --name fnode-node-compile --runtime node
      - wdir: .tests/fnode-node-compile
        steps:
          - filemap:
              target: "src"
              sources:
                - source: |
                    export default async (args) => {
                      console.log("Hello from fnode-node-compile project!");
                      return "Success!";
                    }
                  provider: text
                  target: "index.js"
          - fnode build
          - cd .workspace && fbin compile ./dist/cli/esm/index.js -o .bin/fnode-node-compile
          - wdir: .tests/fnode-node-compile/.workspace
            steps:
              - pwd
              - ls -la .bin
              - ./.bin/fnode-node-compile

test-fnet-compile:
  - rm -rf .tests/fnet-node-compile
  - wdir: .tests
    steps:
      - fnet create --name fnet-node-compile --runtime node
      - wdir: .tests/fnet-node-compile
        steps:
          - filemap:
              target: "src"
              sources:
                - source: |
                    export default async (args) => {
                      console.log("Hello from fnet-node-compile project!");
                      return "Success!";
                    }
                  provider: text
                  target: "src/hello-step.js"
          - fnet build
          - cd .workspace && fbin compile ./dist/cli/esm/index.js -o .bin/fnet-node-compile
          - wdir: .tests/fnet-node-compile/.workspace
            steps:
              - pwd
              - ls -la .bin
              - ./.bin/fnet-node-compile

test-compile-all:
  - frun test-fnode-compile
  - frun test-fnet-compile

# Additional test commands for Phase 3
test-fbin-compile:
  - rm -rf .tests/fbin-compile-test
  - mkdir -p .tests/fbin-compile-test
  - wdir: .tests/fbin-compile-test
    steps:
      - echo 'console.log("Hello from fbin-compile test!");' > test.js
      - fbin compile test.js -o test-bin
      - ./test-bin

test-phase3-all:
  - frun test-fbin-compile
  - frun test-compile-all

# Additional test commands for Phase 4
test-platform-detection:
  - echo "Testing platform detection..."
  - node -e "console.log('Platform:', process.platform)"
  - node -e "console.log('Architecture:', process.arch)"
  - node -e "console.log('OS:', require('os').type())"
  - node -e "console.log('Shell:', process.env.SHELL)"

test-path-handling:
  - echo "Testing path handling..."
  - node -e "console.log('Path separator:', require('path').sep)"
  - node -e "console.log('Delimiter:', require('path').delimiter)"
  - node -e "console.log('Home directory:', require('os').homedir())"
  - node -e "console.log('Temp directory:', require('os').tmpdir())"

test-fbin-platform:
  - echo "Testing fbin commands on current platform..."
  - fbin --version
  - fbin setup --help
  - fbin path --help
  - fbin compile --help

test-phase4-all:
  - frun test-platform-detection
  - frun test-path-handling
  - frun test-fbin-platform

# Additional test commands for Phase 5
test-fbin-install:
  - rm -rf .tests/fbin-install-test
  - mkdir -p .tests/fbin-install-test
  - wdir: .tests/fbin-install-test
    steps:
      - echo 'console.log("Hello from fbin-install test!");' > test.js
      - fbin compile test.js -o test-bin
      - fbin install test-bin --name test-bin-installed
      - fbin list
      - ~/.fnet/bin/test-bin-installed

test-fbin-uninstall:
  - fbin uninstall test-bin-installed --force
  - fbin list

test-fnode-install:
  - rm -rf .tests/fnode-install-test
  - wdir: .tests
    steps:
      - fnode create --name fnode-install-test --runtime node
      - wdir: .tests/fnode-install-test
        steps:
          - filemap:
              target: "src"
              sources:
                - source: |
                    export default async (args) => {
                      console.log("Hello from fnode-install-test project!");
                      return "Success!";
                    }
                  provider: text
                  target: "index.js"
          - fnode build
          - fnode install
          - fbin list
          - ~/.fnet/bin/fnode-install-test

test-fnet-install:
  - rm -rf .tests/fnet-install-test
  - wdir: .tests
    steps:
      - fnet create --name fnet-install-test --runtime node
      - wdir: .tests/fnet-install-test
        steps:
          - filemap:
              target: "src"
              sources:
                - source: |
                    export default async (args) => {
                      console.log("Hello from fnet-install-test project!");
                      return "Success!";
                    }
                  provider: text
                  target: "src/hello-step.js"
          - fnet build
          - fnet install
          - fbin list
          - ~/.fnet/bin/fnet-install-test

test-phase5-all:
  - frun test-fbin-install
  - frun test-fbin-uninstall
  - frun test-fnode-install
  - frun test-fnet-install
```

These commands will:

1. Create test projects using the updated templates
2. Build the projects
3. Compile the projects using the new compile commands
4. Install binaries using the new install commands
5. List installed binaries using the new list command
6. Uninstall binaries using the new uninstall command
7. Verify that all commands work correctly

## 11. Platform Support

The bin system is designed to work across multiple platforms and shell environments:

### 11.1. Operating Systems

- **macOS**: Full support for all shell types
- **Linux**: Full support for all shell types
- **Windows**: Support for PowerShell, PowerShell Core, and Command Prompt

### 11.2. Shell Types

The following shell types are supported:

- **Bash**: The most common shell on Linux and macOS
- **Zsh**: Default shell on newer macOS versions
- **Fish**: A user-friendly shell with advanced features
- **PowerShell**: Modern shell on Windows
- **PowerShell Core**: Cross-platform version of PowerShell
- **Command Prompt (CMD)**: Traditional Windows command shell
- **Ksh**: Korn Shell, common on Unix systems
- **Csh/Tcsh**: C Shell, used on some Unix systems

### 11.3. Configuration Files

The system can detect and modify various shell configuration files:

- **Bash**: `.bashrc`, `.bash_profile`, `.profile`
- **Zsh**: `.zshrc`, `.zprofile`
- **Fish**: `.config/fish/config.fish`
- **PowerShell**: Various profile locations
- **Others**: Shell-specific configuration files

## 12. Conclusion

The bin system will significantly improve the performance and usability of CLI tools created with @fnet/cli. By providing pre-compiled binaries that can be executed directly, users will experience faster startup times and more efficient execution. The system will also simplify distribution and versioning of CLI tools, making it easier for developers to share and use their creations.

Our implementation approach is phased, with a clear focus on first establishing the infrastructure (Phase 1) before moving on to more complex features. This allows us to:

1. Get the basic bin system working quickly
2. Test the core functionality early
3. Gather feedback before implementing more advanced features
4. Ensure a solid foundation for future development

The `fbin` command provides a dedicated, well-structured interface for managing the bin system, keeping this functionality separate from the existing CLI tools while maintaining a consistent user experience. With comprehensive platform support and user-friendly prompts using the `@fnet/prompt` library, the bin system offers a seamless experience across different operating systems and shell environments.
