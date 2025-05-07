# Research: @fnet/yaml Package Analysis

## Overview

This research document examines the @fnet/yaml npm package and its relevance to Flownet CLI. The package enhances YAML functionality for project configuration files, providing extended capabilities beyond standard YAML, transforming it from a static configuration format into a dynamic, programmable configuration language.

## Details

### Package Purpose and Functionality

The @fnet/yaml package serves as an extension to standard YAML processing, designed specifically to enhance configuration files in Flownet projects. Its primary purpose is to transform YAML from a static configuration format into a dynamic, programmable configuration language.

The package builds upon the standard `yaml` npm package (version 2.7+) and adds several powerful features that make configuration files more flexible and maintainable. It provides a layer of abstraction that allows for more complex configuration scenarios while maintaining the readability and simplicity of YAML.

Core functionality includes:

- Loading and parsing YAML files with extended syntax
- Supporting file references to include content from other files
- Enabling dynamic expressions and variable substitution
- Providing conditional configuration based on tags
- Maintaining compatibility with standard YAML syntax

### Key Features

1. **File References**
   - Allows including content from other YAML files using the `g::file://` syntax
   - Example: `flows: g::file://./fnet/flows.yaml`
   - This enables modular configuration files and better organization of complex configurations

2. **Dynamic Expressions**
   - Supports dynamic runtime configuration using the `s::` prefix
   - Example: `s::runtime.type: python`
   - Leverages the @fnet/expression package for expression evaluation

3. **Conditional Configuration**
   - Supports conditional configuration based on tags
   - Configuration can be tailored to different environments or scenarios by passing appropriate tags
   - The `tags` parameter in the API allows for selective processing of configuration sections

4. **Unified API**
   - Provides a consistent API for loading YAML from files or strings
   - Returns both raw content and parsed objects
   - Example usage:

     ```javascript
     const { raw, parsed } = await fnetYaml({
       file: 'path/to/config.yaml',
       tags: ['dev', 'local']
     });
     ```

5. **Compatibility with Standard YAML**
   - Maintains backward compatibility with standard YAML syntax
   - Non-extended syntax is processed normally
   - Uses the yaml package (v2.7+) for base YAML processing

### Integration with Flownet CLI

The @fnet/yaml package is a core component of the Flownet CLI ecosystem, used extensively for handling project configuration files:

1. **Project Configuration Files**
   - Used to process `fnode.yaml` for Node projects
   - Used to process `fnet.yaml` for Workflow projects
   - These files serve as the entry declarative files for Flownet projects

2. **Modular Configuration**
   - Enables splitting configuration across multiple files
   - Workflow definitions can be embedded directly in `fnet.yaml` or referenced from external files
   - Supports conditional loading of configuration based on project context

3. **Dynamic Runtime Configuration**
   - Allows for dynamic setting of runtime properties
   - Supports different execution environments through conditional configuration

### Usage Patterns

Common usage patterns for the @fnet/yaml package include:

1. **Loading Project Configuration**

   ```javascript
   const { raw, parsed } = await fnetYaml({
     file: 'fnode.yaml',
     tags: ['dev']
   });
   ```

2. **Including External Files**

   ```yaml
   # In fnet.yaml
   flows: g::file://./fnet/flows.yaml
   ```

3. **Dynamic Configuration**

   ```yaml
   # In fnode.yaml
   features:
     s::runtime.type: python  # Dynamically set runtime type
   ```

4. **Conditional Configuration with Tags**

   ```javascript
   // Load configuration with specific tags
   const { parsed } = await fnetYaml({
     file: 'config.yaml',
     tags: ['production', 'cloud']
   });
   ```

5. **Processing YAML Content Directly**

   ```javascript
   const { parsed } = await fnetYaml({
     content: yamlContent,
     tags: context.tags
   });
   ```

### Limitations and Considerations

1. **Learning Curve**
   - Extended syntax requires learning beyond standard YAML
   - Documentation may be limited compared to more established packages

2. **Dependency Chain**
   - Relies on other packages like @fnet/expression
   - Changes in dependencies could affect functionality

3. **Performance Considerations**
   - Dynamic resolution and file references may impact performance for very large configurations
   - Caching strategies might be needed for performance-critical applications

4. **Debugging Complexity**
   - Extended syntax can make debugging more complex
   - Error messages might not always clearly indicate the source of problems in complex configurations

### Implementation Recommendations

1. **Standardize Usage Patterns**
   - Establish consistent patterns for file references and dynamic expressions
   - Create templates that demonstrate best practices

2. **Documentation and Examples**
   - Provide comprehensive documentation with examples
   - Include common use cases and troubleshooting guides

3. **Validation Layer**
   - Consider adding schema validation for configuration files
   - Implement validation helpers to catch common configuration errors

4. **Performance Optimization**
   - Implement caching for frequently accessed configurations
   - Consider lazy loading for large configuration files

5. **Integration Testing**
   - Create thorough tests for different configuration scenarios
   - Test with various tag combinations to ensure conditional logic works as expected

## References

- NPM Package: [@fnet/yaml](https://www.npmjs.com/package/@fnet/yaml)
- Dependencies:
  - [@fnet/expression](https://www.npmjs.com/package/@fnet/expression)
  - [get-value](https://www.npmjs.com/package/get-value)
  - [yaml](https://www.npmjs.com/package/yaml)
- [Related Phase: Phase 001 @fnet/yaml Package Analysis](../phases/phase-001.md)
