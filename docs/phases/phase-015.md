# Phase 015: Interactive Selection from List Commands

## Objective

Enhance the user experience in Flownet CLI tools by implementing a pattern where commands that require a name parameter can automatically prompt the user to select from available options when no name is provided, leveraging existing `list` commands as data sources.

## Phase Type

- **Implementation Phase**: Adds minimal working functionality to the system

## Approach

1. Focus on core functionality only - create a reusable utility function for selection prompts
2. Implement the simplest solution that works - modify existing command handlers to use the utility function
3. Avoid premature optimization - start with the most commonly used commands
4. Skip nice-to-have features like fuzzy search for later phases

The implementation will follow these principles:

- Create a common utility function for selection prompts
- Modify command handlers to check if name parameter is missing
- Use existing list functionality to get available options
- Present a selection prompt to the user
- Continue with the command using the selected item
- Respect the `--yes` flag for non-interactive mode

## Checklist

- [x] Create a reusable utility function in `src/utils/prompt-utils.js`
- [x] Implement interactive selection in `fbin uninstall` command
- [x] Implement interactive selection in `fservice definition show/edit/delete/validate` commands
- [x] Implement interactive selection in `fnode express open` command
- [x] Ensure compatibility with `--yes` flag for non-interactive mode
- [x] Test all modified commands
- [x] Update Documentation
  - [x] Add link to this phase in `./phases/index.md`

## Summary

This phase successfully implemented interactive selection functionality for commands that require a name parameter. The implementation includes:

1. A new utility module `src/utils/prompt-utils.js` with two functions:
   - `promptForSelection`: For single item selection
   - `promptForMultipleSelection`: For future use with multi-selection

2. Modified commands to use the new utility:
   - `fbin uninstall`: Now prompts for binary selection when no name is provided
   - `fservice definition show/edit/delete/validate`: Now prompts for service definition selection
   - `fnode express open`: Enhanced to use the new utility for project selection

3. Maintained compatibility with non-interactive mode:
   - Commands with `--yes` flag still require explicit name parameter
   - Clear error messages guide users when name is missing in non-interactive mode

The implementation significantly improves user experience by eliminating the need to run separate list commands before performing operations on specific items. Users can now directly run commands like `fbin uninstall` or `fservice definition show` without remembering exact names, and the CLI will present them with a selection of available options.

## Related Links

- [Related Research: @fnet/prompt Extended Usage Analysis](../research/fnet-prompt-extended-usage.md)
- [Phase 009: @fnet/prompt Extended Usage Analysis](./phase-009.md)
