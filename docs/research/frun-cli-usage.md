# Research: 'frun' CLI Usage from End-User Perspective

## Overview

This research document examines the potential usage patterns, user experience, and implementation considerations for a unified 'frun' CLI entry point that would serve both fnode and fnet projects. The goal is to understand how end-users would interact with this tool and define the optimal user experience.

### Core Philosophy

The 'frun' CLI tool aligns with Flownet's core philosophy of **simplifying the developer experience** by providing a unified interface for executing commands across different project types. This approach:

1. Reduces cognitive load by eliminating the need to remember which CLI tool to use
2. Provides consistency across project types
3. Simplifies the transition between different project types
4. Follows the principle of least surprise for developers

## Details

### Current Command Execution Pattern

Currently, Flownet CLI provides two separate command-line tools for executing commands:

1. **fnode run**: Executes commands defined in fnode.yaml for node/classic projects

   ```bash
   fnode run <command-group>
   ```

2. **fnet run**: Executes commands defined in fnet.yaml for workflow projects

   ```bash
   fnet run <command-group>
   ```

Both tools follow a similar pattern:

- They read command groups from their respective project configuration files
- They execute the commands in the specified group
- They support similar flags and options

This duplication creates unnecessary cognitive load for developers who work with both project types.

### Current 'frun' CLI Implementation

The 'frun' CLI tool is already implemented in the codebase and provides a unified interface for executing command groups from project configuration files. The current implementation has the following structure:

```bash
frun <command> [options]
```

Based on the `frun --help` output, the current implementation supports:

```bash
Usage: frun <command> [options]

Positionals:
  group  Command group to run                                           [string]

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
  --ftag     Tags for conditional configuration                          [array]

Examples:
  frun build            Run the build command group
  frun test --ftag dev  Run the test command group with dev tag
```

Key features in the current implementation:

1. **Project Type Auto-Detection**: Automatically detects whether the current directory contains an fnode or fnet project

   ```javascript
   // From src/frun-cli/command-cmd.js
   await runCommandGroup({
     projectType: 'auto', // Auto-detect project type
     group: argv.group,
     tags: argv.ftag,
     args: argv,
     argv: process.argv
   });
   ```

2. **Command Group Execution**: Executes command groups defined in project configuration files

   ```bash
   frun build   # Executes the 'build' command group
   frun test    # Executes the 'test' command group
   ```

3. **Tag Support**: Supports tags for conditional configuration

   ```bash
   frun test --ftag dev   # Run the test command group with dev tag
   ```

4. **Version Information**: Provides version information

   ```bash
   frun --version   # Shows version number
   ```

5. **Help and Documentation**: Provides help and documentation

   ```bash
   frun --help      # Shows general help
   ```

## References

- [Phase 001: @fnet/yaml Package Analysis](../phases/phase-001.md)
- [Phase 002: @fnet/config Package Analysis](../phases/phase-002.md)
- [Phase 003: @fnet/shell-flow Package Analysis](../phases/phase-003.md)
- [Phase 005: Flownet CLI Entry Points Analysis](../phases/phase-005.md)
- [Phase 007: 'frun' CLI Usage Research](../phases/phase-007.md)
