# Research: @fnet/prompt Extended Usage Analysis

## Overview

This research document examines the @fnet/prompt npm package, its functionality, features, and how it can be optimally used for creating interactive CLI experiences in the Flownet CLI ecosystem. The @fnet/prompt package serves as the primary tool for gathering user input in Flownet CLI applications, providing a rich set of prompt types and options for creating intuitive and user-friendly command-line interfaces.

## Details

### Package Purpose and Architecture

The @fnet/prompt package is a wrapper around the Enquirer library, providing a simplified and consistent API for creating interactive prompts in CLI applications. According to its official documentation, it "offers a straightforward way to gather user input through command-line prompts" and "simplifies the process of defining and collecting responses, making it useful for developers who need a quick and easy solution for interactive command-line applications."

The package is designed to:

1. **Simplify User Input Collection**: Provide an easy-to-use API for collecting user input through various prompt types
2. **Enhance User Experience**: Create visually appealing and intuitive CLI interfaces
3. **Support Non-Interactive Mode**: Allow for automation through the `--yes` flag pattern
4. **Maintain Consistency**: Ensure a consistent look and feel across all Flownet CLI tools
5. **Provide Type Flexibility**: Automatically assign default types and names if not specified
6. **Enable Dynamic Prompt Naming**: Generate default names for prompts for consistent identification

### Prompt Types

The @fnet/prompt package supports several prompt types, each designed for specific input scenarios. According to the official documentation, it supports all Enquirer prompt types:

1. **Input**: Basic text input
   ```javascript
   const { inputValue } = await fnetPrompt({
     type: 'input',
     name: 'inputValue',
     message: 'Enter a value:',
     initial: 'default value'
   });
   ```

2. **Confirm**: Yes/No questions
   ```javascript
   const { confirmValue } = await fnetPrompt({
     type: 'confirm',
     name: 'confirmValue',
     message: 'Are you sure?',
     initial: true
   });
   ```

3. **Select**: Single selection from a list of options
   ```javascript
   const { selectedValue } = await fnetPrompt({
     type: 'select',
     name: 'selectedValue',
     message: 'Select an option:',
     choices: ['option1', 'option2', 'option3'],
     initial: 'option1'
   });
   ```

4. **Multiple Select**: Multiple selections from a list of options
   ```javascript
   const { selectedValues } = await fnetPrompt({
     type: 'multiselect',
     name: 'selectedValues',
     message: 'Select options:',
     choices: ['option1', 'option2', 'option3'],
     initial: ['option1']
   });
   ```

5. **Password**: Masked input for sensitive information

   ```javascript
   const { password } = await fnetPrompt({
     type: 'password',
     name: 'password',
     message: 'Enter password:'
   });
   ```

6. **Number**: Numeric input with validation

   ```javascript
   const { age } = await fnetPrompt({
     type: 'number',
     name: 'age',
     message: 'Enter age:',
     initial: 18
   });
   ```

7. **Array Input**: Collection of multiple values

   ```javascript
   const answers = await fnetPrompt([
     {
       type: 'input',
       name: 'value1',
       message: 'Enter first value:'
     },
     {
       type: 'input',
       name: 'value2',
       message: 'Enter second value:'
     }
   ]);
   ```

### Advanced Features

The @fnet/prompt package includes several advanced features that enhance its functionality. According to the official documentation, these include:

1. **Input Validation**: Validate user input before accepting it

   ```javascript
   await prompt({
     type: 'input',
     name: 'email',
     message: 'Enter email:',
     validate: value => {
       return value.includes('@') || 'Please enter a valid email';
     }
   });
   ```

2. **Custom Formatting**: Format user input for display

   ```javascript
   await prompt({
     type: 'input',
     name: 'username',
     message: 'Username:',
     format: value => value.toLowerCase(),
     result: value => value.trim()
   });
   ```

3. **Conditional Prompts**: Show or hide prompts based on previous answers

   ```javascript
   await prompt([
     {
       type: 'confirm',
       name: 'hasAccount',
       message: 'Do you have an account?'
     },
     {
       type: 'input',
       name: 'email',
       message: 'Enter email:',
       skip: ({ hasAccount }) => !hasAccount
     }
   ]);
   ```

4. **Custom Prompts**: Create custom prompt types for specific use cases
5. **Autocomplete**: Provide autocomplete functionality for input prompts

### Integration with Flownet CLI

The @fnet/prompt package is deeply integrated into the Flownet CLI ecosystem, being used in various commands and utilities:

1. **Project Creation**: Used in `fnode create` and `fnet create` commands to gather project information
2. **Configuration Management**: Used in `fnode input` and `fnet input` commands for configuration input
3. **Binary Management**: Used in `fbin setup`, `fbin path`, and `fbin install` commands for binary management
4. **Express Projects**: Used in `fnode express` and `fnet express` commands for express project management

### Best Practices

Based on the analysis of the codebase, several best practices for using @fnet/prompt have emerged:

1. **Always Support Non-Interactive Mode**: Include conditional logic to handle the `--yes` flag
   ```javascript
   if (!argv.yes) {
     const { confirmValue } = await fnetPrompt({
       type: 'confirm',
       name: 'confirmValue',
       message: 'Are you sure?',
       initial: true
     });

     if (!confirmValue) {
       return;
     }
   }
   ```

2. **Provide Sensible Defaults**: Always include initial values for prompts
   ```javascript
   const { inputValue } = await fnetPrompt({
     type: 'input',
     name: 'inputValue',
     message: 'Enter a value:',
     initial: 'default value'
   });
   ```

3. **Use Descriptive Messages**: Make prompt messages clear and concise
   ```javascript
   const { confirmValue } = await fnetPrompt({
     type: 'confirm',
     name: 'confirmValue',
     message: 'Would you like to add this directory to your PATH?',
     initial: true
   });
   ```

4. **Group Related Prompts**: Use array input for related prompts
   ```javascript
   const answers = await fnetPrompt([
     {
       type: 'input',
       name: 'firstName',
       message: 'Enter your first name:'
     },
     {
       type: 'input',
       name: 'lastName',
       message: 'Enter your last name:'
     }
   ]);
   ```

5. **Use Rich Choices for Select Prompts**: Provide both name and message for select choices
   ```javascript
   const { selectedShell } = await fnetPrompt({
     type: 'select',
     name: 'selectedShell',
     message: 'Select your shell:',
     choices: [
       { name: 'bash', message: 'Bash' },
       { name: 'zsh', message: 'Zsh' },
       { name: 'fish', message: 'Fish' }
     ]
   });
   ```

### Extended Usage Patterns

Beyond the basic usage patterns, @fnet/prompt can be used in more advanced ways:

1. **Dynamic Choices**: Generate choices dynamically based on system state
   ```javascript
   const choices = fs.readdirSync(directory)
     .map(file => ({ name: file, message: file }));

   const { selectedFile } = await fnetPrompt({
     type: 'select',
     name: 'selectedFile',
     message: 'Select a file:',
     choices
   });
   ```

2. **Nested Prompts**: Use conditional logic to show nested prompts
   ```javascript
   const { confirmCustomization } = await fnetPrompt({
     type: 'confirm',
     name: 'confirmCustomization',
     message: 'Would you like to customize the settings?',
     initial: false
   });

   if (confirmCustomization) {
     const { customSetting } = await fnetPrompt({
       type: 'input',
       name: 'customSetting',
       message: 'Enter custom setting:',
       initial: 'default'
     });
   }
   ```

3. **Prompt Chains**: Chain multiple prompts together based on previous answers
   ```javascript
   const { projectType } = await fnetPrompt({
     type: 'select',
     name: 'projectType',
     message: 'Select project type:',
     choices: ['node', 'python', 'bun']
   });

   let additionalOptions = [];

   if (projectType === 'node') {
     additionalOptions = ['typescript', 'javascript'];
   } else if (projectType === 'python') {
     additionalOptions = ['flask', 'django', 'fastapi'];
   }

   if (additionalOptions.length > 0) {
     const { selectedOption } = await fnetPrompt({
       type: 'select',
       name: 'selectedOption',
       message: `Select ${projectType} option:`,
       choices: additionalOptions
     });
   }
   ```

## Recommendations

Based on the analysis of the @fnet/prompt package and its usage in the Flownet CLI ecosystem, the following recommendations are made:

1. **Create a Prompt Utility Module**: Develop a centralized utility module for common prompt patterns
2. **Standardize Prompt Styling**: Ensure consistent styling across all prompts
3. **Implement Validation Helpers**: Create reusable validation functions for common input types
4. **Enhance Documentation**: Provide comprehensive documentation with examples
5. **Add Support for Complex Prompt Types**: Implement support for more complex prompt types like editor, etc.
6. **Create a Prompt Testing Framework**: Develop a testing framework for prompt-based interactions
7. **Implement Error Handling Patterns**: Develop standardized error handling for prompt failures
8. **Create Prompt Chain Utilities**: Build helper functions for managing complex prompt chains
9. **Develop Non-Interactive Mode Standards**: Establish consistent patterns for handling the `--yes` flag across all CLI tools

## References

- [Related Phase: Phase 009 @fnet/prompt Extended Usage Analysis](../phases/phase-009.md)
- [Enquirer Documentation](https://github.com/enquirer/enquirer)
- [NPM Package: @fnet/prompt](https://www.npmjs.com/package/@fnet/prompt)
- [Input Schema for @fnet/prompt](https://www.npmjs.com/package/@fnet/prompt?activeTab=code#input-schema)
- [Output Schema for @fnet/prompt](https://www.npmjs.com/package/@fnet/prompt?activeTab=code#output-schema)
