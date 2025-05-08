# Phase 011: 'fservice' CLI Implementation

## Objective

This phase aims to design and implement a new CLI entry point called 'fservice' that leverages the @fnet/service package capabilities to provide a unified interface for managing system services across different platforms. The focus will be on creating a robust service definition management system that allows users to define, register, and control services based on binaries in the Flownet bin directory.

## Phase Type

- **Implementation Phase**: Design and implementation of a new CLI tool

## Approach

1. Design the core concepts and command structure
2. Implement the service definition management system
3. Integrate with the @fnet/service package for cross-platform service management
4. Ensure compatibility with the existing Flownet CLI ecosystem
5. Provide comprehensive documentation and examples

## Checklist

- [x] Design
  - [x] Define the service definition schema
  - [x] Design the command structure and API
  - [x] Plan the directory structure and file formats
  - [x] Create integration points with the bin system
- [x] Implementation
  - [x] Set up the basic CLI structure
  - [x] Implement the service definition management commands
  - [x] Implement the service registration and control commands
  - [x] Integrate with the @fnet/service package
  - [x] Add support for listing and monitoring services
- [x] Testing
  - [x] Test on macOS
  - [x] Test with various service configurations
  - [x] Test integration with the bin system
- [ ] Documentation
  - [ ] Create user documentation
  - [ ] Add examples and usage patterns
  - [ ] Document integration points with other Flownet tools

## Core Concepts

### Service Definitions

The central concept of the 'fservice' CLI is the "service definition" - a structured configuration that describes how a binary should be run as a service. Service definitions include:

- Service name and description
- Binary to execute (from the Flownet bin directory)
- Command line arguments
- Environment variables
- Working directory
- Auto-start and restart policies
- System vs. user-level service configuration
- Custom metadata

Service definitions are stored as YAML or JSON files in the `~/.fnet/services` directory and can be managed through the `fservice definition` command group.

### Command Structure

The 'fservice' CLI will have the following main command groups:

1. **definition**: Manage service definitions
   - `create`: Create a new service definition
   - `list`: List existing service definitions
   - `show`: Show details of a service definition
   - `edit`: Edit a service definition
   - `delete`: Delete a service definition
   - `validate`: Validate a service definition

2. **register**: Register a service definition as a system service
3. **unregister**: Unregister a service from the system
4. **start**: Start a registered service
5. **stop**: Stop a running service
6. **restart**: Restart a service
7. **status**: Check the status of a service
8. **list**: List all registered services

### Integration with Bin System

The 'fservice' CLI will integrate with the Flownet bin system by:

1. Using binaries from the `~/.fnet/bin` directory as service executables
2. Reading binary metadata from `~/.fnet/metadata/binaries.json`
3. Storing service definitions in `~/.fnet/services`
4. Tracking service status in `~/.fnet/metadata/services.json`

## Implementation Plan

1. **Phase 1: Core Structure and Definition Management** ✅
   - Set up the basic CLI structure
   - Implement the service definition schema
   - Implement the definition management commands
   - Add validation and storage for service definitions

2. **Phase 2: Service Registration and Control** ✅
   - Implement the service registration command
   - Implement service control commands (start, stop, restart)
   - Add status checking and monitoring
   - Implement service listing and filtering

3. **Phase 3: Integration and Polish** ✅
   - Enhance integration with the bin system
   - Add support for multiple service instances
   - Implement proper system vs user service handling
   - Polish the user experience and error handling

## Implementation Summary

The 'fservice' CLI tool has been successfully implemented with the following key features:

1. **Service Definition Management**
   - Created commands for managing service definitions (create, list, show, edit, delete)
   - Implemented YAML-based storage for service definitions
   - Added validation using @fnet/object-from-schema

2. **Service Registration and Control**
   - Implemented registration of services from definitions
   - Added commands for controlling services (start, stop, status)
   - Integrated with @fnet/service for cross-platform support

3. **System vs User Services**
   - Added proper handling of system vs user services
   - Fixed issues with service paths on macOS
   - Ensured correct parameter passing to @fnet/service

4. **Key Technical Improvements**
   - Fixed service path handling for different service types
   - Enhanced error handling and user feedback
   - Improved status reporting with multiple output formats

## Expected Outcome

✅ A fully functional 'fservice' CLI tool that allows users to:

1. ✅ Create and manage service definitions
2. ✅ Register binaries from the Flownet bin directory as system services
3. ✅ Control and monitor services across different platforms
4. ✅ Create multiple service instances from the same binary with different configurations

## Future Improvements

1. **Enhanced Status Reporting**
   - Improve service status detection on macOS
   - Add more detailed status information (uptime, memory usage, etc.)

2. **Service Dependencies**
   - Add support for defining service dependencies
   - Implement proper dependency ordering for start/stop operations

3. **Service Logs**
   - Add commands for viewing and managing service logs
   - Implement log rotation and filtering

4. **Cross-Platform Testing**
   - Test on Windows and Linux platforms
   - Ensure consistent behavior across all supported platforms

## Related Phases

- [Phase 004: @fnet/service Package Analysis](./phase-004.md) - Knowledge phase analyzing the @fnet/service npm package
- [Phase 008: 'fbin' CLI Usage Research](./phase-008.md) - Knowledge phase analyzing the 'fbin' CLI entry point
- [Phase 009: @fnet/prompt Extended Usage Analysis](./phase-009.md) - Knowledge phase analyzing the @fnet/prompt npm package
- [Phase 010: @fnet/object-from-schema Package Analysis](./phase-010.md) - Knowledge phase analyzing the @fnet/object-from-schema npm package
