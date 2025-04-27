# CLI Refactoring Plan

## Overview

This document outlines the plan for refactoring the CLI entry points in the Flownet CLI project. The goal is to improve code organization, maintainability, and extensibility by adopting a more modular approach similar to the one used in the `src/bin` directory.

## Current Structure

Currently, the CLI entry points are organized as follows:

1. `src/builder/lib-cli.js` - Entry point for the `fnode` command
2. `src/builder/wf-cli.js` - Entry point for the `fnet` command
3. `src/builder/run-cli.js` - Entry point for the `frun` command
4. `src/bin/bin-cli.js` - Entry point for the `fbin` command (already refactored)

### Available Commands by CLI Tool

#### `fnode` Commands (from `src/builder/lib-cli.js`)

- `create` - Create a new fnode project
- `project` - Manage fnode project
- `build` - Build fnode project
- `deploy` - Build and deploy fnode project
- `file` - Just create files
- `input` - Create or modify an input config file
- `install` - Install the project as a binary
- `run` - Run a command group
- `with` - Run a command with a config context
- Pass-through commands: `npm`, `node`, `bun`, `serve`, `watch`, `app`, `cli`, `compile`, `npx`, `cdk`, `aws`, `python`, `python3`, `pip`, `pip3`

#### `fnet` Commands (from `src/builder/wf-cli.js`)

- `create` - Initialize a new fnet project
- `project` - Manage fnet project
- `build` - Build fnet project
- `deploy` - Build and deploy fnet project
- `file` - Just create files
- `input` - Create or modify an input config file
- `install` - Install the project as a binary
- `run` - Run a command group
- `with` - Run a command with a config context
- Pass-through commands: `npm`, `node`, `bun`, `serve`, `watch`, `app`, `cli`, `compile`, `npx`, `cdk`, `aws`

#### `frun` Commands (from `src/builder/run-cli.js`)

- Default command - Run a command group from project file

#### `fbin` Commands (from `src/bin/bin-cli.js`)

- `setup` - Initialize the bin system
- `path` - Add bin directory to PATH
- `compile` - Compile a CLI project to a binary
- `install` - Install a binary to the bin directory
- `uninstall` - Uninstall a binary
- `list` - List installed binaries

The `fbin` command has already been refactored to use a modular approach, with each command in its own file:

- `src/bin/bin-cli.js` - Main entry point
- `src/bin/bin-setup.js` - Setup command
- `src/bin/bin-path.js` - Path command
- `src/bin/bin-compile.js` - Compile command
- `src/bin/bin-install.js` - Install command
- `src/bin/bin-uninstall.js` - Uninstall command
- `src/bin/bin-list.js` - List command

## Target Structure

We want to adopt a similar modular approach for the other CLI entry points, using the format `src/<bin name>-cli` to clearly identify CLI directories and `<command name>-cmd.js` for command files:

1. `src/fnode-cli/` directory for the `fnode` command:
   - `src/fnode-cli/fnode-cli.js` - Main entry point
   - `src/fnode-cli/create-cmd.js` - Create command
   - `src/fnode-cli/build-cmd.js` - Build command
   - `src/fnode-cli/deploy-cmd.js` - Deploy command
   - `src/fnode-cli/install-cmd.js` - Install command
   - etc.

2. `src/fnet-cli/` directory for the `fnet` command:
   - `src/fnet-cli/fnet-cli.js` - Main entry point
   - `src/fnet-cli/create-cmd.js` - Create command
   - `src/fnet-cli/build-cmd.js` - Build command
   - `src/fnet-cli/deploy-cmd.js` - Deploy command
   - `src/fnet-cli/install-cmd.js` - Install command
   - etc.

3. `src/frun-cli/` directory for the `frun` command:
   - `src/frun-cli/frun-cli.js` - Main entry point
   - `src/frun-cli/command-cmd.js` - Command handler

4. Common utilities:
   - `src/utils/cli-utils.js` - Common CLI utilities

This naming convention (`src/<bin name>-cli`) clearly identifies CLI-related directories and maintains consistency across all CLI binaries. For consistency, we might also consider renaming the existing `src/bin` directory to `src/fbin-cli` in a future update.

## Migration Plan

### Phase 1: Preparation

1. Create the new directory structure:
   - [x] Create `src/fnode-cli/` directory
   - [x] Create `src/fnet-cli/` directory
   - [x] Create `src/frun-cli/` directory

2. Create common utilities:
   - [x] Extract common functions from existing CLI files to `src/utils/cli-utils.js`
   - [x] Update imports in existing files

3. Set up build fallback:
   - [x] Ensure `bun run build && bun link` works as a fallback if `frun build` fails
   - [x] Document this fallback in the project's README or development guide

### Phase 2: Refactor `frun` Command

The `frun` command is the simplest, so we'll start with it:

1. Create the main entry point:
   - [x] Create `src/frun-cli/frun-cli.js`
   - [x] Move the main logic from `src/builder/run-cli.js`

2. Create command handlers:
   - [x] Create `src/frun-cli/command-cmd.js`
   - [x] Move command-specific logic from `src/builder/run-cli.js`

3. Update entry point:
   - [x] Update `dist/frun/index.js` to use the new entry point

4. Test:
   - [x] Test the refactored `frun` command

### Phase 3: Refactor `fnode` Command

The `fnode` command is more complex:

1. Create the main entry point:
   - [x] Create `src/fnode-cli/fnode-cli.js`
   - [x] Move the main logic from `src/builder/lib-cli.js`

2. Create command handlers:
   - [x] Create `src/fnode-cli/create-cmd.js`
   - [x] Create `src/fnode-cli/project-cmd.js`
   - [x] Create `src/fnode-cli/build-cmd.js`
   - [x] Create `src/fnode-cli/deploy-cmd.js`
   - [x] Create `src/fnode-cli/file-cmd.js`
   - [x] Create `src/fnode-cli/input-cmd.js`
   - [x] Create `src/fnode-cli/install-cmd.js`
   - [x] Create `src/fnode-cli/run-cmd.js`
   - [x] Create `src/fnode-cli/with-cmd.js`
   - [x] Create `src/fnode-cli/passthrough-cmd.js` (for npm, node, bun, etc.)
   - [x] Move command-specific logic from `src/builder/lib-cli.js`

3. Update entry point:
   - [x] Update `dist/fnode/index.js` to use the new entry point

4. Test:
   - [x] Test the refactored `fnode` command

### Phase 4: Refactor `fnet` Command

The `fnet` command is similar to the `fnode` command:

1. Create the main entry point:
   - [x] Create `src/fnet-cli/fnet-cli.js`
   - [x] Move the main logic from `src/builder/wf-cli.js`

2. Create command handlers:
   - [x] Create `src/fnet-cli/create-cmd.js`
   - [x] Create `src/fnet-cli/project-cmd.js`
   - [x] Create `src/fnet-cli/build-cmd.js`
   - [x] Create `src/fnet-cli/deploy-cmd.js`
   - [x] Create `src/fnet-cli/file-cmd.js`
   - [x] Create `src/fnet-cli/input-cmd.js`
   - [x] Create `src/fnet-cli/install-cmd.js`
   - [x] Create `src/fnet-cli/run-cmd.js`
   - [x] Create `src/fnet-cli/with-cmd.js`
   - [x] Create `src/fnet-cli/passthrough-cmd.js` (for npm, node, bun, etc.)
   - [x] Move command-specific logic from `src/builder/wf-cli.js`

3. Update entry point:
   - [x] Update `dist/fnet/index.js` to use the new entry point

4. Test:
   - [x] Test the refactored `fnet` command

### Phase 5: Cleanup and Documentation

1. Cleanup:
   - [x] Remove the old CLI files
   - [x] Update imports in other files

2. Documentation:
   - [x] Update documentation to reflect the new structure
   - [x] Add comments to the new files
   - [x] Document the new directory structure in the project's README

3. Final testing:
   - [x] Test all commands to ensure they work as expected

### Future Considerations

1. ✅ Renamed the existing `src/bin` directory to `src/fbin-cli` for complete consistency.
2. ✅ Updated the file naming to use the `<command>-cmd.js` pattern:
   - `bin-setup.js` → `setup-cmd.js`
   - `bin-path.js` → `path-cmd.js`
   - `bin-compile.js` → `compile-cmd.js`
   - etc.
3. Consider removing the old `src/bin` directory after ensuring all functionality is properly migrated.
4. Ensure all new CLI commands follow this directory structure and file naming pattern.

## Implementation Guidelines

1. **Modularity**: Each command should be in its own file.
2. **Consistency**:
   - Use `src/<bin name>-cli` for CLI directories
   - Use `<command>-cmd.js` for command files
   - Use `<bin name>-cli.js` for main entry points
3. **Documentation**: Add JSDoc comments to all exported functions.
4. **Testing**: Test each command after refactoring.
5. **Backward Compatibility**: Ensure that the refactored commands work exactly the same as the original commands.
6. **Build Process**:
   - Normally, use `frun build` to build the project.
   - If `frun build` fails (which can happen during refactoring since the `frun` command might be broken), use `bun run build && bun link` as a fallback.
   - This fallback is crucial because if the build process fails, the `frun` system might become unavailable.

## Testing Checklist

### Basic Command Testing

#### `frun` Commands

- [x] Default command (run command group) works as expected

#### `fnode` Commands

- [x] `fnode create` command works as expected
- [x] `fnode project` command works as expected
- [x] `fnode build` command works as expected
- [x] `fnode deploy` command works as expected
- [x] `fnode file` command works as expected
- [x] `fnode input` command works as expected
- [x] `fnode install` command works as expected
- [x] `fnode run` command works as expected
- [x] `fnode with` command works as expected
- [x] Pass-through commands (npm, node, bun, etc.) work as expected

#### `fnet` Commands

- [x] `fnet create` command works as expected
- [x] `fnet project` command works as expected
- [x] `fnet build` command works as expected
- [x] `fnet deploy` command works as expected
- [x] `fnet file` command works as expected
- [x] `fnet input` command works as expected
- [x] `fnet install` command works as expected
- [x] `fnet run` command works as expected
- [x] `fnet with` command works as expected
- [x] Pass-through commands (npm, node, bun, etc.) work as expected

### Build Process Testing

- [x] `frun build` works correctly to build the project
- [x] Fallback `bun run build && bun link` works if `frun build` fails
- [x] After each phase, verify that the project can be built successfully

## Timeline

- Phase 1: 1 day
- Phase 2: 1 day
- Phase 3: 2-3 days
- Phase 4: 2-3 days
- Phase 5: 1 day

Total: 7-9 days

## Risk Management

### Potential Risks

1. **Breaking Changes**: Refactoring could introduce breaking changes that affect the functionality of the CLI tools.
   - **Mitigation**: Thorough testing after each phase and maintaining backward compatibility.

2. **Build System Failures**: If the refactoring breaks the build system, it could make further development difficult.
   - **Mitigation**: Use the fallback build process (`bun run build && bun link`) if `frun build` fails.

3. **Dependency Issues**: Changes to the file structure might affect how dependencies are resolved.
   - **Mitigation**: Carefully update all import paths and test thoroughly.

4. **Regression**: New bugs might be introduced during refactoring.
   - **Mitigation**: Comprehensive testing and possibly adding automated tests.

### Rollback Plan

If serious issues are encountered that cannot be quickly resolved:

1. Revert to the last known good state using version control.
2. Document the issues encountered for future refactoring attempts.
3. Consider a more gradual approach with smaller changes.
