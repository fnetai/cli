# Refactoring Plan for Better Runtime Support

## 1. Overview

The goal is to refactor the codebase to better support multiple runtimes (Node.js, Python, and Bun) by splitting the code into separate runtime builders. This will make the codebase more modular, maintainable, and extensible.

## 2. Current Structure

Currently, the codebase has:
- `lib-cli.js`: Main entry point for the `fnode` command
- `lib-builder.js`: Monolithic builder class that handles all runtimes
- Runtime-specific code scattered throughout the builder class
- Runtime-specific API modules in separate directories

## 3. Proposed Structure

### 3.1. Entry Points
- `lib-cli.js`: Main entry point for the `fnode` command (refactored)
- `wf-cli.js`: Main entry point for the `fnet` command (unchanged)
- `run-cli.js`: Main entry point for the `frun` command (unchanged)

### 3.2. Builder Classes
- `lib-builder-base.js`: Base builder class with common functionality
- `lib-builder-node.js`: Node.js-specific builder
- `lib-builder-python.js`: Python-specific builder
- `lib-builder-bun.js`: Bun-specific builder

### 3.3. Runtime Factory
- `runtime-factory.js`: Factory to create the appropriate builder based on runtime type

## 4. Implementation Steps

### 4.1. Create Base Builder Class
1. Extract common functionality from `lib-builder.js` into `lib-builder-base.js`
2. Define abstract methods that runtime-specific builders must implement
3. Move shared utility methods to the base class

### 4.2. Create Runtime-Specific Builders
1. Create `lib-builder-node.js`, `lib-builder-python.js`, and `lib-builder-bun.js`
2. Implement runtime-specific methods in each builder
3. Extend the base builder class

### 4.3. Create Runtime Factory
1. Create `runtime-factory.js` to instantiate the appropriate builder
2. Add support for runtime detection and builder creation

### 4.4. Refactor Entry Point
1. Update `lib-cli.js` to use the runtime factory
2. Ensure backward compatibility
3. Simplify the main code flow

## 5. Benefits

1. **Modularity**: Each runtime has its own builder class
2. **Extensibility**: Easy to add new runtimes
3. **Maintainability**: Clearer separation of concerns
4. **Testability**: Easier to test individual components
5. **Scalability**: Better support for future runtimes

## 6. Potential Challenges

1. **Preserving Functionality**: Ensure ALL existing functionality is maintained throughout the refactoring
2. **Backward Compatibility**: Ensure existing projects continue to work without modification
3. **Code Duplication**: Avoid duplicating code across runtime builders
4. **API Consistency**: Maintain consistent APIs across different runtimes
5. **Testing**: Comprehensive testing needed for all runtimes and all commands

## 7. Implementation Details

### 7.1. Base Builder Class (`lib-builder-base.js`)

```javascript
// Common functionality:
// - Authentication
// - Project initialization
// - Template rendering
// - Dependency management
// - Deployment
```

### 7.2. Runtime-Specific Builders

```javascript
// Node.js Builder:
// - Node.js-specific initialization
// - NPM package management
// - Rollup configuration
// - TypeScript support

// Python Builder:
// - Python-specific initialization
// - Conda environment management
// - Python package management

// Bun Builder:
// - Bun-specific initialization
// - Bun package management
// - Bun build configuration
```

### 7.3. Runtime Factory

```javascript
// Factory to create the appropriate builder:
// - Detect runtime from project configuration
// - Create and return the appropriate builder
// - Handle fallbacks and defaults
```

## 8. Migration Strategy

1. Create the new structure without modifying existing code
2. Gradually move functionality from the old structure to the new one
3. Implement comprehensive tests for each feature before and after migration
4. Verify that ALL existing functionality works exactly as before
5. Switch to the new structure only after confirming 100% functional parity
6. Keep the original code as fallback until the new structure is proven stable
7. Remove deprecated code only after extensive testing in various environments

## 9. Timeline

1. Phase 1: Create base builder and factory (1-2 days)
2. Phase 2: Implement Node.js builder (1-2 days)
3. Phase 3: Implement Python and Bun builders (2-3 days)
4. Phase 4: Refactor entry point (1 day)
5. Phase 5: Testing and bug fixing (2-3 days)

Total estimated time: 7-11 days

## 10. Implementation Checklist

### Phase 1: Create Base Builder and Factory

- [x] Create `lib-builder-base.js` with common functionality
  - [x] Extract authentication methods
  - [x] Extract project initialization methods
  - [x] Extract template rendering methods
  - [x] Extract deployment methods
  - [x] Define abstract methods for runtime-specific implementations

- [x] Create `runtime-factory.js`
  - [x] Implement runtime detection logic
  - [x] Implement builder creation logic
  - [x] Add support for fallbacks and defaults

### Phase 2: Implement Node.js Builder

- [x] Create `lib-builder-node.js`
  - [x] Implement Node.js-specific initialization
  - [x] Implement NPM package management
  - [x] Implement Rollup configuration
  - [x] Implement TypeScript support

- [x] Update factory to support Node.js runtime
- [x] Test with existing Node.js projects

### Phase 3: Implement Python and Bun Builders

- [x] Create `lib-builder-python.js`
  - [x] Implement Python-specific initialization
  - [x] Implement Conda environment management
  - [x] Implement Python package management

- [x] Create `lib-builder-bun.js`
  - [x] Implement Bun-specific initialization
  - [x] Implement Bun package management
  - [x] Implement Bun build configuration

- [x] Update factory to support Python and Bun runtimes
- [x] Test with existing Python and Bun projects

### Phase 4: Refactor Entry Point

- [x] Update `lib-cli.js` to use the runtime factory
  - [x] Modify build command
  - [x] Modify deploy command
  - [x] Modify file command

- [x] Ensure backward compatibility
- [x] Simplify the main code flow

### Phase 5: Testing and Bug Fixing

- [x] Create test projects for each runtime
- [x] Create a comprehensive test matrix covering all commands and runtimes
- [x] Verify that ALL existing functionality works exactly as before
- [x] Compare output of old and new implementations to ensure identical results
- [x] Test with real-world projects of varying complexity
- [x] Test edge cases and error handling
- [x] Fix any bugs or issues
- [x] Document any changes in behavior (should be none)
- [x] Update documentation with new architecture details
- [x] Create a rollback plan in case issues are discovered after deployment

## 11. Conclusion

This refactoring will significantly improve the codebase's ability to support multiple runtimes (Node.js, Python, and Bun) while making it more maintainable and extensible. The modular approach provides a clearer separation of concerns and makes the code more organized.
