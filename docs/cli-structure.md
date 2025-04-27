# CLI Structure

This document describes the structure of the CLI tools in the Flownet CLI project.

## Overview

The Flownet CLI project provides several CLI tools:

- `fnode`: CLI for managing fnode projects
- `fnet`: CLI for managing fnet projects
- `frun`: CLI for running command groups from project files
- `fbin`: CLI for managing binaries

## Directory Structure

The CLI tools are organized in a modular way:

```bash
src/
├── fbin-cli/             # fbin CLI
│   ├── index.js          # Main entry point
│   ├── bin-cli.js        # Backward compatibility entry point
│   ├── context.js        # Context utilities
│   ├── utils.js          # CLI-specific utilities
│   ├── compile-cmd.js    # Compile command
│   ├── install-cmd.js    # Install command
│   ├── list-cmd.js       # List command
│   ├── path-cmd.js       # Path command
│   ├── setup-cmd.js      # Setup command
│   └── uninstall-cmd.js  # Uninstall command
│
├── fnode-cli/            # fnode CLI
│   ├── index.js          # Main entry point
│   ├── fnode-cli.js      # Backward compatibility entry point
│   ├── context.js        # Context utilities
│   ├── utils.js          # CLI-specific utilities
│   ├── build-cmd.js      # Build command
│   ├── create-cmd.js     # Create command
│   ├── deploy-cmd.js     # Deploy command
│   ├── file-cmd.js       # File command
│   ├── input-cmd.js      # Input command
│   ├── install-cmd.js    # Install command
│   ├── passthrough-cmd.js # Passthrough commands
│   ├── project-cmd.js    # Project command
│   ├── run-cmd.js        # Run command
│   └── with-cmd.js       # With command
│
├── fnet-cli/             # fnet CLI
│   ├── index.js          # Main entry point
│   ├── fnet-cli.js       # Backward compatibility entry point
│   ├── context.js        # Context utilities
│   ├── utils.js          # CLI-specific utilities
│   ├── build-cmd.js      # Build command
│   ├── create-cmd.js     # Create command
│   ├── deploy-cmd.js     # Deploy command
│   ├── file-cmd.js       # File command
│   ├── input-cmd.js      # Input command
│   ├── install-cmd.js    # Install command
│   ├── passthrough-cmd.js # Passthrough commands
│   ├── project-cmd.js    # Project command
│   ├── run-cmd.js        # Run command
│   └── with-cmd.js       # With command
│
├── frun-cli/             # frun CLI
│   ├── index.js          # Main entry point
│   ├── frun-cli.js       # Backward compatibility entry point
│   ├── context.js        # Context utilities
│   ├── utils.js          # CLI-specific utilities
│   └── command-cmd.js    # Command handler
│
└── utils/                # Common utilities
    ├── cli-utils.js      # Common CLI utilities
    ├── common-run.js     # Common run utilities
    └── process-manager.js # Process management utilities
```

## Common Patterns

### Main Entry Points

Each CLI tool has a main entry point file (`index.js`) that:

1. Sets up the CLI environment
2. Imports and registers commands
3. Handles errors and process termination

For backward compatibility, each CLI tool also has a `*-cli.js` file that simply imports the `index.js` file.

### Command Files

Each command is defined in its own file with a consistent pattern:

```javascript
/**
 * Command configuration
 */
const command = {
  command: 'command-name',
  describe: 'Command description',
  builder: (yargs) => {
    // Define command options
    return yargs.option(...);
  },
  handler: async (argv) => {
    // Handle command execution
    try {
      // Command logic
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  }
};

export default command;
```

### Utilities

Utilities are organized at two levels:

1. **CLI-specific utilities** in each CLI directory:
   - `context.js`: Context creation and management for the specific CLI
   - `utils.js`: Utility functions specific to the CLI

2. **Common utilities** shared across all CLIs:
   - `cli-utils.js`: Common CLI utilities for binding commands
   - `common-run.js`: Common utilities for running command groups
   - `process-manager.js`: Utilities for managing processes

This organization helps avoid circular dependencies and keeps related functionality together.

## Future Improvements

For complete consistency, consider:

1. Removing the old `src/bin` directory after ensuring all functionality is properly migrated
2. Ensuring all new CLI commands follow this directory structure and file naming pattern
3. Adding more comprehensive tests for all CLI commands
