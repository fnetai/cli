# Research: Template Directory Analysis

## Overview

This research document examines the template directory in the Flownet CLI project, its structure, purpose, and how it's used throughout the codebase. The template directory serves as a centralized repository of project templates that are used by the Flownet CLI tools to generate new projects and project components.

### Core Philosophy

One of the most important goals of Flownet CLI is to **isolate non-functional components from developers**, allowing them to focus solely on functional code. This is achieved by:

1. Using templates to generate all non-functional code and configuration
2. Placing generated components in a `.workspace` directory
3. Providing a clean separation between functional code (in the parent directory) and build/run operations (in `.workspace`)

This approach significantly reduces cognitive load on developers, who can concentrate on writing the core functional logic of their applications without worrying about boilerplate, configuration, and build processes. The template system is the foundation that enables this developer experience.

## Details

### Template Directory Structure

The template directory is organized hierarchically to support different project types and runtime environments:

```bash
template/
├── fnet/                  # Templates for workflow projects
│   ├── bun/               # Bun runtime templates
│   │   └── src/           # Source code templates
│   │       ├── app/       # Web application templates
│   │       ├── cli/       # CLI templates
│   │       └── default/   # Default module templates
│   │           ├── blocks/    # Workflow block templates
│   │           └── macros/    # Reusable template macros
│   ├── core/              # Core templates shared across runtimes
│   ├── node/              # Node.js runtime templates
│   │   └── src/           # Similar structure to bun
│   └── project/           # Project structure templates
│       ├── .vscode/       # VS Code configuration
│       └── fnet/          # Flownet configuration
├── fnode/                 # Templates for node/classic projects
│   ├── bun/               # Bun runtime templates
│   ├── node/              # Node.js runtime templates
│   ├── project/           # Project structure templates
│   └── python/            # Python runtime templates
└── schemas/               # JSON schema templates
```

This structure allows the Flownet CLI to generate projects with different configurations while maintaining consistency across project types.

### Multi-Runtime Support

A key feature of Flownet CLI is its support for multiple runtime environments:

1. **Node/Classic Projects (fnode)** support three runtimes:
   - **Node.js**: Traditional JavaScript runtime
   - **Bun**: Modern JavaScript runtime with enhanced performance
   - **Python**: Support for Python projects

2. **Workflow Projects (fnet)** currently support:
   - **Node.js**: Primary supported runtime
   - **Bun**: Experimental support

The template system is designed to accommodate these different runtimes while providing a consistent developer experience. Each runtime has its own set of templates that generate appropriate configuration files, build scripts, and project structures.

### The .workspace Directory

A fundamental aspect of Flownet CLI's philosophy is the separation between functional code and build/run operations through the `.workspace` directory:

1. **Functional Code**: Lives in the parent directory and contains only the core business logic
   - Developers focus on writing this code
   - Minimal boilerplate and configuration
   - Clear separation of concerns

2. **.workspace Directory**: Contains all generated code and configuration
   - Build scripts and configuration
   - Generated artifacts
   - Runtime dependencies
   - Non-functional components

When a developer creates a project with Flownet CLI, the templates generate both the minimal functional code structure in the main directory and the complete build/run infrastructure in the `.workspace` directory. This allows developers to focus solely on their core logic while the CLI handles all the complexity of building, testing, and running the application.

### Template File Types

The template directory contains several types of files:

1. **Nunjucks Templates** (`.njk`): Dynamic templates that are processed with context data
   - Configuration files (package.json.njk, tsconfig.json.njk)
   - Source code files (index.js.njk, engine.js.njk)
   - HTML files (index.html.njk)
   - Documentation files (readme.md.njk)

2. **Static Files**: Files that are copied as-is to the output directory
   - .gitignore
   - License files
   - Configuration files that don't need processing

3. **Schema Files**: JSON Schema definitions used for validation
   - input.yaml
   - output.yaml

### Template Rendering Process

Templates are rendered using the `@flownet/lib-render-templates-dir` library, which is a wrapper around the Nunjucks templating engine. The rendering process typically follows these steps:

1. **Context Preparation**: A context object is created with data for the template
   ```javascript
   const templateContext = {
     atom: atom,                   // Project configuration
     packageDependencies: packageDependencies  // Dependencies
   }
   ```

2. **Template Resolution**: The template directory is resolved using the `resolveTemplatePath` utility
   ```javascript
   const templateDir = resolveTemplatePath('./template/fnode/project');
   ```

3. **Rendering**: Templates are rendered with the context data
   ```javascript
   await fnetRender({
     pattern: ["index.js.njk"],
     dir: path.resolve(templateDir, `src/cli`),
     outDir,
     context: templateContext,
   });
   ```

4. **Output**: Rendered files are written to the output directory

The `resolveTemplatePath` function is particularly important as it handles the resolution of template paths in both development and production environments:

```javascript
export default function resolveTemplatePath(templatePath) {
  // First, try to resolve from the current working directory (local development)
  const localPath = path.resolve(cwd, templatePath);
  if (fs.existsSync(localPath)) {
    return localPath;
  }

  // If not found locally, try to resolve from the package directory (published package)
  const packagePath = path.resolve(__dirname, '../..', templatePath);
  if (fs.existsSync(packagePath)) {
    return packagePath;
  }

  // If still not found, throw an error
  throw new Error(`Template path not found: ${templatePath}`);
}
```

### Template Usage in the Codebase

Templates are used throughout the Flownet CLI codebase for various purposes:

1. **Project Creation**:
   - `fnode create` and `fnet create` commands use templates to generate new projects
   - Example from `src/fnode-cli/create-cmd.js`:
     ```javascript
     const templateDir = resolveTemplatePath('./template/fnode/project');
     await fnetRender({
       dir: templateDir,
       outDir,
       context: { name: argv.name, runtime: argv.runtime },
       copyUnmatchedAlso: true
     });
     ```

2. **Component Creation**:
   - Templates are used to create specific components like CLI interfaces or web applications
   - Example from `src/builder/api/create-cli/index.js`:
     ```javascript
     await fnetRender({
       pattern: ["index.js.njk"],
       dir: path.resolve(templateDir, `src/cli`),
       outDir,
       context: templateContext,
     });
     ```

3. **Configuration Generation**:
   - Templates generate configuration files like package.json, tsconfig.json, etc.
   - Example from `src/builder/api/create-ts-config/index.js`:
     ```javascript
     const template = nunjucks.compile(
       fs.readFileSync(path.resolve(templateDir, `tsconfig.json.njk`), "utf8"),
       nunjucks.configure(templateDir)
     );
     ```

4. **Documentation Generation**:
   - Templates generate README files and other documentation
   - Example from `src/builder/api/create-project-readme/index.js`

5. **Code Generation**:
   - Templates generate source code files for different project components
   - Example from workflow block generation in `src/builder/wf-builder.js`

### Template Features and Capabilities

The template system in Flownet CLI supports several advanced features:

1. **Conditional Logic**: Templates use Nunjucks conditionals to adapt to different configurations
   ```njk
   {% if atom.doc.features.cli.enabled %}
   // CLI-specific code
   {% endif %}
   ```

2. **Macros**: Reusable template fragments defined as macros
   ```njk
   {% macro importMcpDependencies() %}
   import { Server } from "@modelcontextprotocol/sdk/server/index.js";
   // More imports...
   {% endmacro %}
   ```

3. **Template Inheritance**: Templates can extend or include other templates
   ```njk
   {% include "header.njk" %}
   ```

4. **Variable Substitution**: Templates can substitute variables from the context
   ```njk
   "name": "{{atom.doc.name}}",
   ```

5. **Loops and Iterations**: Templates can iterate over arrays and objects
   ```njk
   {% for dep in packageDependencies %}
   "{{dep.package}}": "{{dep.version}}"{% if not loop.last %},{% endif %}
   {% endfor %}
   ```

### Template Customization

The template system allows for customization based on project configuration:

1. **Runtime-Specific Templates**: Different templates for Node.js, Bun, and Python
2. **Project Type Templates**: Different templates for fnode and fnet projects
3. **Feature-Based Conditionals**: Templates adapt based on enabled features
   ```njk
   {% if atom.doc.features.cli.mcp.enabled===true %}
   // MCP-specific code
   {% endif %}
   ```

### Integration with Project Configuration

Templates are tightly integrated with the project configuration system:

1. **Atom Object**: Templates access project configuration through the `atom` object
   ```njk
   "name": "{{atom.doc.name}}",
   "version": "{{atom.doc.version}}",
   ```

2. **Feature Detection**: Templates check for enabled features
   ```njk
   {% if atom.doc.features.app.enabled===true %}
   // App-specific code
   {% endif %}
   ```

3. **Format Adaptation**: Templates adapt to different module formats
   ```njk
   {% if atom.doc.features.project.format==='esm' %}
   // ESM-specific code
   {% else %}
   // CJS-specific code
   {% endif %}
   ```

### CLI Mode Support

Templates support different CLI modes for projects:

1. **Default Mode**: Standard CLI execution
   ```njk
   {{ defaultModeStandard('Node') }}
   ```

2. **MCP Mode**: Model Context Protocol mode for LLM integration
   ```njk
   {% if atom.doc.features.cli.mcp.enabled===true %}
   {{ mcpModeCode('Node') }}
   {% endif %}
   ```

3. **HTTP Mode**: HTTP server mode
   ```njk
   {% if atom.doc.features.cli.http.enabled===true %}
   {{ httpModeCodeExpress('Node') }}
   {% endif %}
   ```

## Key Insights

### Developer Experience Focus

The template system in Flownet CLI is fundamentally designed to improve developer experience by:

1. **Reducing Cognitive Load**: By isolating non-functional components, developers can focus on what matters most - the core business logic
2. **Providing Consistency**: Templates ensure consistent project structure and configuration across different projects
3. **Enabling Multi-Runtime Support**: The same project can be developed for different runtimes (Node.js, Bun, Python) with minimal changes
4. **Simplifying Complex Tasks**: Build, test, and deployment configurations are generated automatically

### The .workspace Pattern

The `.workspace` pattern is a key architectural decision that:

1. **Separates Concerns**: Functional code is clearly separated from build/run infrastructure
2. **Hides Complexity**: Complex build configurations and dependencies are hidden from the developer
3. **Enables Portability**: Projects can be easily moved or shared without carrying unnecessary build artifacts
4. **Facilitates Upgrades**: The build infrastructure can be updated without affecting the functional code

### Template System as an Enabler

The template system is not just a convenience but a core enabler of Flownet CLI's philosophy:

1. **It's the Foundation**: Without templates, the separation of functional and non-functional code would be difficult to maintain
2. **It's Extensible**: New runtimes and features can be added by creating new templates
3. **It's Adaptable**: Templates can be customized to support different project requirements
4. **It's Evolving**: The template system is designed to grow with the Flownet ecosystem

## Recommendations

1. **Template Documentation**:
   - Document template variables and context objects
   - Create a style guide for template development
   - Provide examples of common template patterns

2. **Template Testing**:
   - Develop a testing framework for templates
   - Validate generated code for syntax errors
   - Test templates with different configurations

3. **Template Versioning**:
   - Implement versioning for templates
   - Ensure backward compatibility
   - Document breaking changes

4. **Template Customization**:
   - Allow users to provide custom templates
   - Support template overrides
   - Implement template hooks for extension

5. **Template Optimization**:
   - Reduce duplication across templates
   - Extract common patterns into shared macros
   - Optimize template rendering performance

6. **Template Validation**:
   - Validate template syntax before rendering
   - Provide helpful error messages for template issues
   - Implement linting for templates

## References

- Template Directory: [template/](../../template/)
- Template Resolution: [src/utils/resolve-template-path.js](../../src/utils/resolve-template-path.js)
- Project Creation: [src/fnode-cli/create-cmd.js](../../src/fnode-cli/create-cmd.js)
- CLI Creation: [src/builder/api/create-cli/index.js](../../src/builder/api/create-cli/index.js)
- Nunjucks Documentation: [https://mozilla.github.io/nunjucks/](https://mozilla.github.io/nunjucks/)
- [Related Phase: Phase 006 Template Directory Analysis](../phases/phase-006.md)
