# Research: 'fservice' CLI Design and Implementation

## Overview

This research document outlines the design and implementation plan for the 'fservice' CLI tool, a new entry point in the Flownet CLI ecosystem that provides cross-platform service management capabilities. The 'fservice' CLI leverages the @fnet/service package to abstract away platform-specific service management details while introducing a powerful "service definition" concept that allows users to define, register, and control services based on binaries in the Flownet bin directory.

## Details

### Core Concepts

#### Service Definitions

The central concept of the 'fservice' CLI is the "service definition" - a structured configuration that describes how a binary should be run as a service. Service definitions are stored as YAML or JSON files in the `~/.fnet/services` directory and include:

```yaml
name: api-service
binary: my-app
description: API Service for My Application
args:
  - --port=3000
  - --mode=api
env:
  NODE_ENV: production
  LOG_LEVEL: info
workingDir: /path/to/working/directory
autoStart: true
restartOnFailure: true
system: true
user: myuser
instances: 1
metadata:
  version: 1.0.0
  tags:
    - api
    - production
```

This approach allows users to:
1. Create multiple service configurations for the same binary
2. Manage service definitions independently from service registration
3. Version control and share service definitions
4. Apply consistent configuration across different environments

#### Service Management

The 'fservice' CLI provides commands for:

1. **Definition Management**: Create, list, show, edit, delete, and validate service definitions
2. **Service Registration**: Register service definitions as system services
3. **Service Control**: Start, stop, restart, and check the status of services
4. **Service Monitoring**: List all registered services and their status

### Command Structure

The 'fservice' CLI has the following command structure:

```
fservice <command> [options]
```

#### Main Commands:

1. **definition**: Manage service definitions
   ```
   fservice definition <subcommand> [options]
   ```
   Subcommands:
   - `create`: Create a new service definition
   - `list`: List existing service definitions
   - `show`: Show details of a service definition
   - `edit`: Edit a service definition
   - `delete`: Delete a service definition
   - `validate`: Validate a service definition

2. **register**: Register a service definition as a system service
   ```
   fservice register --definition <definition-name> [options]
   ```
   Options:
   - `--definition`: Service definition name (required)
   - `--start`: Start the service after registration (default: false)

3. **unregister**: Unregister a service from the system
   ```
   fservice unregister --name <service-name> [options]
   ```
   Options:
   - `--name`: Service name (required)
   - `--keep-definition`: Keep the service definition (default: true)

4. **start**: Start a registered service
   ```
   fservice start --name <service-name> [options]
   ```
   Options:
   - `--name`: Service name (required)

5. **stop**: Stop a running service
   ```
   fservice stop --name <service-name> [options]
   ```
   Options:
   - `--name`: Service name (required)

6. **restart**: Restart a service
   ```
   fservice restart --name <service-name> [options]
   ```
   Options:
   - `--name`: Service name (required)

7. **status**: Check the status of a service
   ```
   fservice status --name <service-name> [options]
   ```
   Options:
   - `--name`: Service name (required)
   - `--format`: Output format (json, text, table)

8. **list**: List all registered services
   ```
   fservice list [options]
   ```
   Options:
   - `--binary`: Filter by binary name
   - `--status`: Filter by status (running, stopped, failed)
   - `--format`: Output format (json, text, table)

### Integration with Bin System

The 'fservice' CLI integrates with the Flownet bin system by:

1. Using binaries from the `~/.fnet/bin` directory as service executables
2. Reading binary metadata from `~/.fnet/metadata/binaries.json`
3. Storing service definitions in `~/.fnet/services`
4. Tracking service status in `~/.fnet/metadata/services.json`

This integration allows users to:
1. Easily create services from compiled binaries
2. Manage service lifecycle independently from binary management
3. Update binaries without affecting service configurations
4. Create multiple service instances from the same binary

### Service Definition Schema

The service definition schema is designed to be comprehensive yet flexible:

```json
{
  "type": "object",
  "required": ["name", "binary"],
  "properties": {
    "name": {
      "type": "string",
      "description": "Service name",
      "x-prompt": {
        "type": "input",
        "message": "Enter service name:"
      }
    },
    "binary": {
      "type": "string",
      "description": "Binary name in the bin directory",
      "x-prompt": {
        "type": "select",
        "message": "Select binary:",
        "choices": [] // Dynamically populated from bin directory
      }
    },
    "description": {
      "type": "string",
      "description": "Service description",
      "x-prompt": {
        "type": "input",
        "message": "Enter service description:"
      }
    },
    "args": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Command line arguments",
      "x-prompt": {
        "type": "input",
        "message": "Enter command line arguments (space-separated):"
      }
    },
    "env": {
      "type": "object",
      "additionalProperties": {
        "type": "string"
      },
      "description": "Environment variables",
      "x-prompt": {
        "type": "input",
        "message": "Enter environment variables (KEY=VALUE format, one per line):"
      }
    },
    "workingDir": {
      "type": "string",
      "description": "Working directory",
      "x-prompt": {
        "type": "input",
        "message": "Enter working directory (optional):"
      }
    },
    "autoStart": {
      "type": "boolean",
      "description": "Start on boot",
      "default": false,
      "x-prompt": {
        "type": "confirm",
        "message": "Start service on boot?",
        "initial": false
      }
    },
    "restartOnFailure": {
      "type": "boolean",
      "description": "Restart on failure",
      "default": true,
      "x-prompt": {
        "type": "confirm",
        "message": "Restart service on failure?",
        "initial": true
      }
    },
    "system": {
      "type": "boolean",
      "description": "System service",
      "default": true,
      "x-prompt": {
        "type": "confirm",
        "message": "Register as system service?",
        "initial": true
      }
    },
    "user": {
      "type": "string",
      "description": "User to run the service as",
      "x-prompt": {
        "type": "input",
        "message": "Enter user to run the service as (optional):"
      }
    },
    "instances": {
      "type": "integer",
      "description": "Number of instances to run",
      "default": 1,
      "minimum": 1,
      "x-prompt": {
        "type": "number",
        "message": "Enter number of instances to run:",
        "initial": 1
      }
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true,
      "description": "Custom metadata"
    }
  }
}
```

This schema is used with the @fnet/object-from-schema package to provide interactive prompts for creating and editing service definitions.

## Implementation Plan

The implementation of the 'fservice' CLI will be divided into three phases:

### Phase 1: Core Structure and Definition Management

1. Set up the basic CLI structure
2. Implement the service definition schema
3. Implement the definition management commands
4. Add validation and storage for service definitions

### Phase 2: Service Registration and Control

1. Implement the service registration command
2. Implement service control commands (start, stop, restart)
3. Add status checking and monitoring
4. Implement service listing and filtering

### Phase 3: Integration and Polish

1. Enhance integration with the bin system
2. Add support for multiple service instances
3. Implement advanced features like service logs
4. Polish the user experience and error handling

## References

- [Phase 004: @fnet/service Package Analysis](../phases/phase-004.md)
- [Phase 008: 'fbin' CLI Usage Research](../phases/phase-008.md)
- [Phase 009: @fnet/prompt Extended Usage Analysis](../phases/phase-009.md)
- [Phase 010: @fnet/object-from-schema Package Analysis](../phases/phase-010.md)
- [Phase 011: 'fservice' CLI Implementation](../phases/phase-011.md)
- [NPM Package: @fnet/service](https://www.npmjs.com/package/@fnet/service)
