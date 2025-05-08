# Research: @fnet/config Package Analysis

## Overview

This research document examines the @fnet/config npm package and its relevance to Flownet CLI. The package provides configuration management capabilities for Flownet projects, enabling flexible and structured access to configuration data across different environments and deployment scenarios.

## Details

### Package Purpose and Functionality

The @fnet/config package serves as a configuration management solution for Flownet CLI projects. Its primary purpose is to provide a standardized way to load, access, and manage configuration data from various sources, with support for environment-specific configurations.

The package builds upon the @fnet/yaml package to provide enhanced configuration capabilities, allowing developers to:

- Load configuration from files with a consistent naming convention
- Support multiple configuration sources with fallbacks
- Apply environment-specific configurations using tags
- Access configuration data through a structured API
- Validate configuration against expected schemas
- Transfer configuration values to environment variables when needed

At its core, @fnet/config simplifies the process of managing configuration across different environments (development, testing, production) and deployment targets, ensuring that applications have access to the correct configuration values in each context.

### Key Features

1. **Unified Configuration Loading**
   - Loads configuration from files with standardized naming patterns
   - Supports multiple configuration sources with a single API call
   - Example: `await fnetConfig({ name: "redis", dir: projectDir })`

2. **Named Configuration Files**
   - Uses a naming convention for configuration files (e.g., `redis.yaml`, `fnet-node.yaml`)
   - Allows specifying multiple configuration names as an array
   - Supports optional configurations that won't cause errors if missing

3. **Tag-Based Configuration**
   - Leverages @fnet/yaml's tag-based configuration for environment-specific settings
   - Allows passing tags to selectively apply configuration sections
   - Example: `await fnetConfig({ name: "deploy", tags: ["production", "cloud"] })`

4. **Environment Variable Integration**
   - Option to transfer configuration values to environment variables
   - Useful for applications that rely on environment variables for configuration
   - Controlled via the `transferEnv` option (default: true)

5. **Directory-Based Configuration**
   - Specifies the directory to search for configuration files
   - Defaults to the current working directory if not specified
   - Example: `await fnetConfig({ name: "app", dir: projectDir })`

6. **Structured Return Value**
   - Returns an object containing both the file path and the parsed configuration data
   - Example return: `{ file: "/path/to/config.yaml", data: { /* config data */ } }`

### Integration with Flownet CLI

The @fnet/config package is deeply integrated into the Flownet CLI ecosystem:

1. **Deployment Configurations**
   - Used extensively in deployment modules for various targets (Docker, Electron, PyPI, etc.)
   - Provides target-specific configuration for deployment processes
   - Example: `const { file: configFile, data: config } = await fnetConfig({ name: target.config || "fnet-node", dir: context.projectDir, tags: context.tags })`

2. **CLI Environment Setup**
   - Used in both fnode-cli and fnet-cli to set up the environment
   - Loads optional configurations like Redis settings
   - Example: `fnetConfig({ name: ["redis"], dir: cwd, optional: true })`

3. **Project Templates**
   - Integrated into project templates for configuration loading
   - Used in input argument handling for CLI tools
   - Example from templates: `const { default: fnetConfig } = await import("@fnet/config"); const config = await fnetConfig({ name: fargs, tags: ftags })`

4. **Command Execution**
   - Used to provide environment variables for command execution
   - Supports the `with` command in fnet-cli for running commands with specific configurations

### Relationship with @fnet/yaml

The @fnet/config package has a direct dependency on @fnet/yaml and leverages its capabilities:

1. **Dependency Relationship**
   - @fnet/config depends on @fnet/yaml for YAML parsing and enhancement
   - Uses @fnet/yaml's extended features for dynamic and conditional configuration

2. **Feature Leveraging**
   - Inherits all the dynamic capabilities of @fnet/yaml
   - Supports file references, dynamic expressions, and tag-based configuration
   - Adds a layer of abstraction for easier configuration management

3. **Complementary Functionality**
   - While @fnet/yaml focuses on enhancing YAML syntax and parsing
   - @fnet/config focuses on configuration file management and access patterns
   - Together they provide a complete configuration solution for Flownet projects

### Usage Patterns

Common usage patterns for the @fnet/config package include:

1. **Basic Configuration Loading**

   ```javascript
   import fnetConfig from '@fnet/config';

   const { file, data } = await fnetConfig({
     name: "app",
     dir: projectDir
   });

   // Access configuration data
   const apiUrl = data.env.API_URL;
   ```

2. **Optional Configuration**

   ```javascript
   const config = await fnetConfig({
     name: "redis",
     dir: projectDir,
     optional: true
   });

   if (config?.data) {
     // Use Redis configuration
   }
   ```

3. **Environment-Specific Configuration**

   ```javascript
   const { data: config } = await fnetConfig({
     name: "deploy",
     dir: projectDir,
     tags: ["production"]
   });
   ```

4. **Multiple Configuration Sources**

   ```javascript
   const config = await fnetConfig({
     name: ["app", "secrets", "database"],
     dir: projectDir
   });
   ```

5. **Preventing Environment Variable Transfer**

   ```javascript
   const { data: config } = await fnetConfig({
     name: "sensitive",
     dir: projectDir,
     transferEnv: false
   });
   ```

### Limitations and Considerations

1. **Configuration File Discovery**
   - Limited to the specified directory
   - No recursive search through parent directories
   - May require explicit path specification in complex project structures

2. **Schema Validation**
   - No built-in schema validation for configuration files
   - Requires additional validation logic in application code

3. **Configuration Merging**
   - When using multiple configuration sources, merging behavior may not be obvious
   - May require careful ordering of configuration names

4. **Environment Variable Naming**
   - When transferring to environment variables, naming conventions may cause conflicts
   - No built-in prefixing or namespacing for environment variables

5. **Synchronous API Limitations**
   - API is primarily asynchronous
   - May complicate usage in synchronous contexts

### Implementation Recommendations

1. **Standardized Configuration Structure**
   - Establish consistent structure for configuration files
   - Consider using a common top-level structure (e.g., `env`, `settings`, `features`)
   - Example:

     ```yaml
     env:
       API_URL: "https://api.example.com"
     settings:
       timeout: 30000
     features:
       enableCache: true
     ```

2. **Configuration Validation**
   - Implement validation for configuration files
   - Consider using JSON Schema or similar for validation
   - Validate configuration early in application startup

3. **Environment Variable Strategy**
   - Develop a clear strategy for environment variable usage
   - Consider using prefixes to avoid conflicts
   - Document which configurations are transferred to environment variables

4. **Configuration Documentation**
   - Document available configuration options
   - Include examples for different environments
   - Provide templates for common configuration scenarios

5. **Integration Testing**
   - Test configuration loading across different environments
   - Verify that tag-based configurations work as expected
   - Test optional configuration behavior

## References

- NPM Package: [@fnet/config](https://www.npmjs.com/package/@fnet/config)
- Dependencies:
  - [@fnet/args](https://www.npmjs.com/package/@fnet/args)
  - [@fnet/yaml](https://www.npmjs.com/package/@fnet/yaml)
- [Related Phase: Phase 002 @fnet/config Package Analysis](../phases/phase-002.md)
- [Related Research: @fnet/yaml Package Analysis](./fnet-yaml.md)
