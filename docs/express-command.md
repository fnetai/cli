# Express Command Documentation

## Overview

The `express` command suite is designed to provide developers with a quick way to create, manage, and access test projects without the hassle of managing project directories. It works with projects in a dedicated location (`~/.fnet/express`) for easy access and management. The main command is essentially a streamlined version of the existing `create` command, with predefined directory management, while additional subcommands provide management capabilities for the express project directory.

## Command Structure

```
# Create a new express project
fnode express [project-name] [options]
fnet express [project-name] [options]

# List existing express projects
fnode express list [options]
fnet express list [options]

# Open an existing express project
fnode express open [project-name] [options]
fnet express open [options]

# Move/promote an express project to a real project location
fnode express move [project-name] [destination] [options]
fnet express move [project-name] [destination] [options]
```

## Behavior

### Express Create (Default Command)

1. When executed without a subcommand, `express` creates a new project in the `~/.fnet/express` directory.
2. Projects are organized by date in the format `YYYYMMDD`.
3. The naming convention depends on whether a project name is provided:

   - **If no name is provided**:
     - `~/.fnet/express/YYYYMMDD/fnode-[number]` (for fnode projects)
     - `~/.fnet/express/YYYYMMDD/fnet-[number]` (for fnet projects)
     - Example: `~/.fnet/express/20230428/fnode-1`

   - **If a name is provided and is unique for that day**:
     - `~/.fnet/express/YYYYMMDD/[name]`
     - Example: `~/.fnet/express/20230428/test-project`

   - **If a name is provided but already exists for that day**:
     - `~/.fnet/express/YYYYMMDD/[name]-[number]`
     - Example: `~/.fnet/express/20230428/test-project-1`

4. After creating the project, the command outputs the project path and provides instructions on how to access it.

### Express List

1. The `express list` command displays all express projects, organized by date.
2. It shows the project name, type (fnode/fnet), creation date, and full path.
3. The command supports filtering by date, type, or name pattern.

### Express Open

1. The `express open` command opens an existing express project.
2. If a project name is provided, it searches for that project.
3. If no project name is provided, it shows a list of recent projects to choose from.
4. The command can open the project in the file explorer, terminal, or an IDE (VS Code/VS Code Insiders).

### Express Move

1. The `express move` command promotes an express project to a real project location.
2. It copies the entire project to the specified destination directory.
3. If no destination is provided, it prompts the user to select a location.
4. After moving, it offers to delete the original express project or keep it as a backup.
5. When run from within an express project directory, the command automatically detects that it's an express project and uses the current project as the source.
6. This allows developers to seamlessly transition from a test project to a production-ready project when they're satisfied with the results.

## Interactive Features

The `express` command is designed to be fully interactive:

- It will use the `@fnet/prompt` package for user interaction
- It will guide the user through the project creation process with prompts
- It will offer to open the project in an IDE (VS Code or VS Code Insiders if available)
- If both VS Code and VS Code Insiders are available, it will ask the user which one to use
- The command will handle all directory management automatically

## Command Options

While the command is primarily interactive, it supports one important option:

- `--yes` or `-y`: Skip all interactive prompts and use default values (useful for scripts or quick usage)

## Examples

```bash
# Create a quick fnode project
fnode express

# Create a fnode project with a specific name
fnode express my-test-project

# Create a fnet project
fnet express

# Create a project and skip all interactive prompts
fnode express --yes

# List all express projects
fnode express list

# List express projects created today
fnode express list --today

# List only fnode projects
fnode express list --type fnode

# Open a specific project
fnode express open my-test-project

# Open the most recent project
fnode express open --latest

# Open a project and select from a list
fnode express open

# Move a project to a specific location
fnode express move my-test-project ~/projects/production-ready

# Move a project with interactive destination selection
fnode express move my-test-project

# Move the most recent project
fnode express move --latest

# Move the current project (when run from within an express project)
cd ~/.fnet/express/20230428/my-test-project
fnode express move
```

## Implementation Details

### Express Create

1. The main command will be implemented in `src/fnode-cli/express-cmd.js` and `src/fnet-cli/express-cmd.js`.
2. It will reuse the logic from the existing `create` command, with the main difference being the target directory.
3. The command will ensure the `~/.fnet/express` directory exists, creating it if necessary.
4. For numbering projects, the command will scan the day's directory and find the highest number used, then increment it.
5. The command will use the `@fnet/prompt` package for interactive prompts.
6. After project creation, it will detect available IDEs (VS Code, VS Code Insiders) and offer to open the project.
7. If the `--yes` flag is provided, it will skip interactive prompts and use default values.

### Express List

1. The list subcommand will be implemented in the same files as the main command.
2. It will scan the `~/.fnet/express` directory and its subdirectories to find all projects.
3. Projects will be displayed in a table format, sorted by date (newest first).
4. The command will support filtering options like `--today`, `--type`, and `--name`.

### Express Open

1. The open subcommand will be implemented in the same files as the main command.
2. It will search for projects by name, or display a list of recent projects if no name is provided.
3. The command will detect available IDEs and offer to open the project in the preferred one.
4. It will support options like `--latest` to open the most recently created project.

### Express Move Implementation

1. The move subcommand will be implemented in the same files as the main command.
2. It will copy the project files to the specified destination, preserving all content and structure.
3. The command will handle path resolution, directory creation, and file copying.
4. After copying, it will offer to delete the original project or keep it as a backup.
5. It will support options like `--latest` to move the most recently created project.
6. When run from within an express project directory, it will automatically detect the current project as the source.
7. The command will also update any project-specific paths or configurations during the move process.

## Benefits

- **Quick Project Creation**: Provides a fast way to create test projects without managing directories
- **Project Organization**: Organizes test projects by date for easy reference
- **Clean Separation**: Maintains a clear distinction between real projects and test/express projects
- **Enhanced Developer Experience**: Integrates with IDEs for a smoother workflow
- **Project Discovery**: Makes it easy to find and access previously created test projects
- **Streamlined Workflow**: Interactive prompts guide developers through the process
- **Time Saving**: Reduces the time spent on project setup and management
- **Seamless Transition**: Allows promoting test projects to production-ready projects when they're successful
- **No Lost Work**: Preserves all development work when moving from test to production environment

## Implementation Checklist

### Preparation

- [ ] Review and finalize the express command documentation
- [ ] Identify dependencies needed for implementation
- [ ] Ensure `@fnet/prompt` package is available and up-to-date
- [ ] Plan the directory structure for the implementation

### Core Implementation

#### Express Create Command

- [ ] Create `express-cmd.js` in both `src/fnode-cli` and `src/fnet-cli` directories
- [ ] Implement the base command structure
- [ ] Add logic to create the `~/.fnet/express` directory if it doesn't exist
- [ ] Implement date-based directory structure (YYYYMMDD)
- [ ] Implement project naming logic:
  - [ ] Auto-numbering for unnamed projects
  - [ ] Using provided names when unique
  - [ ] Adding numbers to duplicate names
- [ ] Reuse project creation logic from existing `create` command
- [ ] Implement interactive prompts using `@fnet/prompt`
- [ ] Add IDE detection and integration (VS Code, VS Code Insiders)
- [ ] Implement `--yes` flag to skip interactive prompts
- [ ] Add proper error handling and user feedback

#### Express List Command

- [ ] Implement the `list` subcommand in the express command files
- [ ] Add logic to scan the express directory for projects
- [ ] Implement sorting by date (newest first)
- [ ] Create a formatted table display for projects
- [ ] Implement filtering options:
  - [ ] `--today` for today's projects
  - [ ] `--type` for filtering by project type
  - [ ] `--name` for filtering by name pattern
- [ ] Add proper error handling and user feedback

#### Express Open Command

- [ ] Implement the `open` subcommand in the express command files
- [ ] Add logic to find projects by name
- [ ] Implement interactive project selection when no name is provided
- [ ] Add IDE detection and integration
- [ ] Implement `--latest` option to open the most recent project
- [ ] Add proper error handling and user feedback

#### Express Move Command

- [ ] Implement the `move` subcommand in the express command files
- [ ] Add logic to copy project files to a specified destination
- [ ] Implement interactive destination selection
- [ ] Add logic to detect when running from within an express project
- [ ] Implement project configuration updates during the move process
- [ ] Add option to delete or keep the original project after moving
- [ ] Implement `--latest` option to move the most recent project
- [ ] Add proper error handling and user feedback

### Integration

- [ ] Register the express command in the CLI entry points
- [ ] Update command help documentation
- [ ] Ensure proper command discovery in the CLI tools

### Testing

- [ ] Create test cases for each subcommand
- [ ] Test the express command with various scenarios:
  - [ ] Creating projects with and without names
  - [ ] Listing projects with different filters
  - [ ] Opening projects with different methods
  - [ ] Moving projects to different destinations
- [ ] Test IDE integration with available editors
- [ ] Test error handling and edge cases
- [ ] Verify that the command works correctly in different environments

### Documentation

- [ ] Update the main CLI documentation to include the express command
- [ ] Add examples to the documentation
- [ ] Create a user guide for the express command
- [ ] Document any known limitations or edge cases

### Final Steps

- [ ] Review the implementation against the requirements
- [ ] Perform a final round of testing
- [ ] Get feedback from team members
- [ ] Make any necessary adjustments
- [ ] Prepare for release

## Test Command Groups for fnet.yaml

The following command groups can be added to the project's `fnet.yaml` file to facilitate testing of the express command functionality:

```yaml
commands:
  # Basic express command tests
  test-express-create:
    - fnode express test-project
    - fnode express
    - fnet express test-workflow
    - fnet express

  # Express list command tests
  test-express-list:
    - fnode express list
    - fnode express list --today
    - fnode express list --type fnode
    - fnode express list --type fnet

  # Express open command tests
  test-express-open:
    - fnode express open --latest
    - fnode express open test-project

  # Express move command tests
  test-express-move:
    - mkdir -p ~/test-destination
    - fnode express move --latest ~/test-destination
    - rm -rf ~/test-destination

  # Comprehensive express command test
  test-express-all:
    - fnode express test-all-project
    - fnode express list
    - fnode express open test-all-project
    - mkdir -p ~/test-destination
    - fnode express move test-all-project ~/test-destination
    - rm -rf ~/test-destination

  # Test express command with --yes flag
  test-express-yes:
    - fnode express --yes
    - fnode express list

  # Test express command from within an express project
  # Using wdir to change working directory for isolated execution
  test-express-within:
    - fnode express test-within
    - wdir: ~/.fnet/express/$(date +%Y%m%d)/test-within
      steps:
        - fnode express move ~/test-destination
        - rm -rf ~/test-destination

  # Test express command with different project types
  test-express-types:
    - fnode express node-test
    - fnet express flow-test
    - fnode express list --type fnode
    - fnode express list --type fnet

  # Test express command error handling
  test-express-errors:
    - fnode express open non-existent-project
    - fnode express move non-existent-project ~/test-destination
    - mkdir -p ~/test-destination/existing-project
    - fnode express test-project
    - fnode express move test-project ~/test-destination/existing-project
    - rm -rf ~/test-destination
```

These command groups can be executed using `frun test-express-create`, `frun test-express-list`, etc., to test different aspects of the express command functionality.
