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

### Phase 2: Binary Management

1. Implement binary compilation with Bun
2. Create binary naming and versioning system
3. Add commands for managing binaries:
   - `fbin install`: Install binary from a project
   - `fbin uninstall`: Remove a binary
   - `fbin list`: List all installed binaries
   - `fbin update`: Update a binary to the latest version
   - `fbin clean`: Remove unused versions

### Phase 3: Integration with Build System

1. Add `--bin` flag to build and deploy commands
2. Update project templates to support binary compilation
3. Add binary-specific configuration options to project files

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

2. Phase 2: Binary Management (2-3 days)
   - Implement binary compilation with Bun
   - Implement binary management commands

3. Phase 3: Integration with Build System (1-2 days)
   - Add `--bin` flag to build and deploy commands
   - Update project templates
   - Add binary-specific configuration options

4. Phase 4: Testing and Bug Fixing (2-3 days)
   - Test on different operating systems
   - Test with different project types
   - Performance testing
   - Documentation updates

Total estimated time: 6-10 days

## 10. Implementation Checklist for Phase 1

The following checklist focuses on Phase 1 (Setup and Infrastructure) which is our immediate priority:

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
