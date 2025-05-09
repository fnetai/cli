# Phase 016: Express Remove and Enter Commands

## Objective

Enhance the Flownet CLI express commands by adding two new functionalities:

1. `remove` command - Allow users to delete express projects interactively
2. `enter` command - Allow users to enter the directory of an express project in the active terminal

These commands will be implemented for both `fnode express` and `fnet express` CLI tools.

## Phase Type

- **Implementation Phase**: Adds minimal working functionality to the system

## Approach

1. Focus on core functionality - implement the simplest solution that works
2. Leverage existing code patterns and utilities - reuse the interactive selection functionality
3. Ensure consistent behavior between `fnode` and `fnet` CLI tools
4. Maintain compatibility with existing command structure and options

The implementation will follow these principles:

- Reuse existing utility functions for selection prompts
- Implement consistent command structure across CLI tools
- Provide clear feedback to users about actions being performed
- Handle edge cases gracefully (no projects found, user cancellation)

## Checklist

- [x] Implement `remove` command in `fnode-cli/express-cmd.js`
  - [x] Add command definition with appropriate options
  - [x] Implement handler function for removing projects
  - [x] Use interactive selection when no project name is provided
  - [x] Add confirmation prompt before deletion
  - [x] Handle edge cases (no projects found, cancellation)

- [x] Implement `enter` command in `fnode-cli/express-cmd.js`
  - [x] Add command definition with appropriate options
  - [x] Implement handler function for entering project directory
  - [x] Use interactive selection when no project name is provided
  - [x] Handle edge cases (no projects found, cancellation)

- [x] Implement `remove` command in `fnet-cli/express-cmd.js`
  - [x] Add command definition with appropriate options
  - [x] Implement handler function for removing projects
  - [x] Use interactive selection when no project name is provided
  - [x] Add confirmation prompt before deletion
  - [x] Handle edge cases (no projects found, cancellation)

- [x] Implement `enter` command in `fnet-cli/express-cmd.js`
  - [x] Add command definition with appropriate options
  - [x] Implement handler function for entering project directory
  - [x] Use interactive selection when no project name is provided
  - [x] Handle edge cases (no projects found, cancellation)

- [x] Add test commands to `fnet.yaml`
  - [x] Test commands for `fnode express remove`
  - [x] Test commands for `fnode express enter`
  - [x] Test commands for `fnet express remove`
  - [x] Test commands for `fnet express enter`

- [x] Update Documentation
  - [x] Add link to this phase in `./phases/index.md`

## Implementation Details

### Remove Command

The `remove` command will:

1. Allow users to specify a project name to remove
2. If no project name is provided, show an interactive selection prompt
3. Confirm with the user before deleting the project
4. Provide clear feedback about the deletion process

Command structure:

```bash
fnode express remove [project-name]
fnet express remove [project-name]
```

Options:

- `--latest`: Remove the most recent project
- `--yes` or `-y`: Skip confirmation prompt

### Enter Command

The `enter` command will:

1. Allow users to specify a project name to enter
2. If no project name is provided, show an interactive selection prompt
3. Launch a new shell in the project directory
4. Return to the original directory when the user exits the shell
5. Provide clear feedback about the process

Command structure:

```bash
fnode express enter [project-name]
fnet express enter [project-name]
```

Options:

- `--latest`: Enter the most recent project directory

## Summary

This phase successfully implemented two new commands for the express functionality in both fnode and fnet CLI tools:

1. The `remove` command allows users to delete express projects with the following features:
   - Interactive selection when no project name is provided
   - Confirmation prompt before deletion (can be skipped with --yes flag)
   - Support for removing the latest project with --latest flag
   - Clear feedback about the deletion process

2. The `enter` command helps users navigate to express project directories with these features:
   - Interactive selection when no project name is provided
   - Support for entering the latest project directory with --latest flag
   - Launches a new shell in the target directory
   - Returns to the original directory when the user exits the shell
   - Clear feedback about the process

Both commands leverage the existing project selection utilities and maintain consistent behavior between fnode and fnet CLI tools. The implementation follows the pattern established in Phase 015 for interactive selection.

## Related Links

- [Phase 015: Interactive Selection from List Commands](./phase-015.md)
