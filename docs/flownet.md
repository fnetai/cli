# Introduction to Flownet Framework

## The Vision Behind Flownet

Flownet is built on a simple yet powerful vision: **isolate all non-functional components so developers can focus solely on functional code**.

Think about it - even for a simple "Hello World!" application that you want to deploy, how many different files and configurations do you need beyond your actual functional code? Package managers, build tools, deployment configurations, and more - these non-functional components often require significant time and attention, distracting from the core business logic.

## The Core Philosophy

The fundamental philosophy of Flownet is that **all non-functional components should be regenerable**.

This means developers and AI agents can focus exclusively on writing the functional code that delivers actual value, while Flownet handles everything else automatically.

## How Flownet Works

### Project Types: Workflow vs Node

Flownet supports two main project types, independent of the underlying runtime:

#### fnode Project

An **fnode project** (Flow Node Project) is a classic/node-style project that focuses on creating reusable components or standalone applications. These projects:

- Use `fnode.yaml` as their configuration file
- Typically contain a single code file in the `src` directory
- Can be built with different runtimes (Node.js, Python, Bun)
- Are managed using the `fnode` command-line tool

Thanks to `@fnet/yaml`, any field in the `fnode.yaml` file can either contain the actual configuration or reference external files:

```yaml
# Option 1: Direct configuration in fnode.yaml
features:
  runtime:
    type: node
dependencies:
  - express
  - lodash

# Option 2: Reference external configuration
features: g::file://./config/features.yaml...
dependencies: g::file://./config/dependencies.yaml...
```

This flexibility allows you to keep your project file compact while still maintaining all necessary configuration.

##### Multi-Language Support

Flownet supports multiple programming languages within fnode projects. Currently, the supported languages are:

```text
my-fnode-project/
├── src/
│   ├── index.js          # JavaScript implementation (used by both Node.js and Bun)
│   └── index.py          # Python implementation
├── fnode.yaml            # Project configuration file
└── .workspace/           # Build infrastructure (managed by CLI)
```

This multi-language approach offers several powerful advantages:

- **Focus on Functional Reference Code**: Write your core logic once, and migrate it to other languages as needed
- **Language Agnostic Development**: Choose the best language for each specific use case
- **Optimal Runtime Selection**: Use the `--ftag` parameter to select which language implementation to build and run

For example, you might use JavaScript with Node.js for quick development, Python for data processing, and JavaScript with Bun for improved performance - all within the same project structure.

This approach allows developers to focus on functional logic rather than language-specific constraints.

#### fnet Project

An **fnet project** (Flow Network Project) is a workflow-oriented project that orchestrates processes and services. These projects:

- Use `fnet.yaml` as their configuration file
- Define workflows either:
  - Directly embedded in the `flows` field of the `fnet.yaml` file, or
  - Referenced from an external file (typically `fnet/flows.yaml`) using `@fnet/yaml` references
- Can include local code in the `src/local` directory when needed
- Are managed using the `fnet` command-line tool

For example, workflows can be defined in either of these ways:

```yaml
# Option 1: Embedded directly in fnet.yaml
flows:
  main:
    steps:
      - id: step1
        type: transform
        # ...more step configuration

# Option 2: Referenced from an external file
flows: g::file://./fnet/flows.yaml...
```

This distinction allows developers to choose the project structure that best fits their needs and use cases. Throughout this documentation, we'll refer to these as "fnode projects" and "fnet projects" for clarity.

### Core Component and Wrappers

A flownet project produces a core component/library that can be used in multiple contexts through prepared wrappers:

- **CLI Wrapper**: Allows the core component to be used from the command line
- **App Wrapper**: Enables the core component to be used in a browser environment

These wrappers can be used for both testing/development and production purposes. Features can be enabled or disabled through framework templates based on your project's needs.

### Project Configuration Files

Since all non-functional components are isolated, each project type needs its own configuration file to manage the project:

- **`fnet.yaml`**: Configuration file for Workflow projects (`fnet`)
- **`fnode.yaml`**: Configuration file for Node projects (`fnode`)

These configuration files are the entry declarative files for Flownet projects. They contain all the project settings, dependencies, features, and other configuration details needed to manage the project.

#### Enhanced YAML with @fnet/yaml

Flownet uses the `@fnet/yaml` npm package to make these configuration files more powerful and flexible than standard YAML. This package transforms YAML from a static configuration format into a dynamic, programmable configuration language with features like:

- **File References**: Include content from other YAML files

  ```yaml
  # In fnet.yaml
  flows: g::file://./fnet/flows.yaml...
  ```

- **Dynamic Runtime Configuration**: Set runtime type dynamically

  ```yaml
  # In fnode.yaml
  features:
    s::runtime.type: python  # or bun, node, etc.
  ```

- **Tag-Based Configuration**: Apply configurations based on environment tags

  ```yaml
  # Only applied when 'dev' tag is present
  t::dev::database:
    url: "mongodb://localhost:27017"

  # Only applied when 'prod' tag is present
  t::prod::database:
    url: "mongodb://production-server:27017"
  ```

- **Multiple Content Sources**: Load content from various sources

  ```yaml
  # Load from HTTP source
  remote_config: g::https://example.com/config.yaml...

  # Load from npm package
  package_config: g::npm:@fnet/webauth@^0.1/fnet/input.yaml...
  ```

- **Text and Binary Content**: Load raw text or binary content

  ```yaml
  # Load text content
  readme: g::text::file://./README.md...

  # Load binary content
  image: g::binary::file://./logo.png...
  ```

- **Custom Processors**: Special prefixes for different operations
  - `s::` (Setter): For setting properties using dot notation
  - `g::` (Getter): For retrieving values from files or URLs
  - `t::` (Tag): For conditional configuration based on environment tags
  - `gtext::` and `gbinary::`: For loading raw text or binary content

This powerful approach allows you to create flexible, environment-aware configurations while maintaining the simplicity and readability of YAML.

### Command Line Interface

Flownet provides two main CLI tools that reflect the project types:

- **`fnode`**: For Node/classic projects (uses `fnode.yaml`)
- **`fnet`**: For Workflow projects (uses `fnet.yaml`)

As a developer, you only need to know these commands and their options. The internal implementation details (like `lib-cli.js`, `wf-cli.js`, or `run-cli.js`) are abstracted away, allowing you to focus solely on your project's functional code.

#### Core Commands

Flownet provides four main CLI tools:

- **`fnode`**: For Node/classic projects (uses `fnode.yaml`)
- **`fnet`**: For Workflow projects (uses `fnet.yaml`)
- **`frun`**: Unified interface that works with both project types (auto-detects project file)
- **`fbin`**: Binary management system for installing, compiling, and managing CLI tools

These CLI tools share similar command structures but serve different purposes:

##### Project Creation

```bash
# For Node/classic projects
fnode create --name <project-name> [--runtime <node|python|bun>] [--vscode <true|false>]

# For Workflow projects
fnet create --name <project-name> [--runtime <node>] [--vscode <true|false>]
```

##### Project Management

```bash
# Update an existing project with the latest templates
fnode project --update
fnet project --update
```

##### Building Projects

```bash
# For Node/classic projects
fnode build [--id <id>] [--buildId <build-id>] [--mode <all|file|build|deploy|bpmn>] [--ftag <tags>]

# For Workflow projects
fnet build [--id <id>] [--buildId <build-id>] [--mode <all|file|build|deploy|bpmn>] [--ftag <tags>]
```

##### Deployment

```bash
# For Node/classic projects
fnode deploy [--id <id>] [--buildId <build-id>] [--ftag <tags>]

# For Workflow projects
fnet deploy [--id <id>] [--buildId <build-id>] [--ftag <tags>]
```

##### File Generation Only

```bash
# Generate files without building
fnode file [--id <id>] [--buildId <build-id>] [--ftag <tags>]
fnet file [--id <id>] [--buildId <build-id>] [--ftag <tags>]
```

#### Configuration Commands

##### Input Configuration

```bash
# Create or modify an input configuration file
fnode input [name]
fnet input [name]
```

This creates a configuration file in the `.fnet` directory based on the `input` schema defined in your project file.

##### Running Commands from Project File

```bash
# Execute a command group defined in the project file
fnode run <command-group> [--ftag <tags>]  # Only looks for fnode.yaml
fnet run <command-group> [--ftag <tags>]   # Only looks for fnet.yaml
frun <command-group> [--ftag <tags>]       # Auto-detects project type
```

This executes command groups defined in the `commands` section of your project file. Flownet uses the powerful `@fnet/shell-flow` package to provide a flexible command execution system.

The `frun` command is a unified interface that works with both project types. It automatically detects whether you're in a `fnode` or `fnet` project and runs the appropriate command group. This is especially useful when you're working with multiple project types and want a consistent interface.

###### Command Group Structure

You can define sophisticated command groups in your project file:

```yaml
commands:
  # Simple sequential commands
  build:
    - "echo 'Starting build'"
    - steps:
        - "npm install"
        - "npm run build"
        - "npm run test"
      onError: "stop"
      captureName: "build_output"

  # Complex deployment with parallel and background tasks
  deploy:
    - "echo 'Starting deployment'"
    - parallel:
        - "npm run test:unit"
        - "npm run test:integration"
    - fork:
        - "npm run watch:css"
        - "npm run watch:js"
      env:
        NODE_ENV: "production"

  # Control commands and templating
  greet:
    - echo: "Hello, {{username}}!"
    - sleep: 2
    - echo: "Running in {{environment}} mode"
    - exit: "{{success ? 0 : 1}}"
    context:
      username: "developer"
      environment: "development"
      success: true

  # File mapping example
  assets:
    - echo: "Starting file mapping"
    - filemap:
        target: "dist"
        sources:
          - source: "templates"
            target: "."
            symlink: false
          - source: "assets"
            target: "assets"
            symlink: true
    - echo: "File mapping completed"
    context:
      app:
        name: "My App"
        version: "1.0.0"
```

###### Key Features

The command system supports:

- **Sequential Execution**: Run commands one after another
- **Parallel Execution**: Run multiple commands simultaneously
- **Background Tasks**: Start processes that continue running in the background
- **Control Commands**: Special commands like `echo`, `sleep`, and `exit`
- **File Mapping**: Copy or symlink files with the `filemap` command
- **Template Variables**: Use `{{variable}}` syntax for dynamic values
- **Error Handling**: Configure how errors are handled with `onError`
- **Retry Mechanism**: Automatically retry failed commands
- **Script Mode**: Execute commands in a script file for better performance
- **Output Capture**: Capture command output for later use

This powerful system allows you to define complex build, test, and deployment workflows directly in your project file, eliminating the need for separate build scripts.

##### Environment-Aware Command Execution

```bash
# Run a command with environment variables from a config file
fnode with <config> <command> [options..]
fnet with <config> <command> [options..]
```

This runs a command with environment variables from a specified configuration file.

#### Binary System Commands

The `fbin` CLI tool provides a powerful binary management system that allows you to compile, install, and manage CLI tools:

```bash
# Initialize the bin system
fbin setup

# Add bin directory to PATH
fbin path [--yes]

# Compile a CLI project to a binary
fbin compile [source] [options]

# Install a binary to the bin directory
fbin install [source] [options]

# Uninstall a binary from the bin directory
fbin uninstall [name] [options]

# List installed binaries
fbin list [options]
```

The binary system also integrates with `fnode` and `fnet` projects:

```bash
# Compile and install a CLI-enabled fnode project
fnode compile [options]
fnode install [options]

# Compile and install a CLI-enabled fnet project
fnet compile [options]
fnet install [options]
```

These commands make it easy to create, distribute, and manage CLI tools built with Flownet. The `--yes` or `-y` flag can be used with most commands to automatically answer yes to all prompts, which is useful for scripting and automation.

#### Development Commands

##### Node.js Commands

```bash
# Run npm commands in the project context
fnode npm [commands..]
fnet npm [commands..]

# Run node commands in the project context
fnode node [commands..]
fnet node [commands..]

# Run npx commands in the project context
fnode npx [commands..]
fnet npx [commands..]
```

##### Bun Commands

```bash
# Run bun commands in the project context
fnode bun [commands..]
fnet bun [commands..]

# Run specific bun scripts
fnode serve [options..]  # Runs 'bun run serve'
fnode watch [options..]  # Runs 'bun run watch'
fnode app [options..]    # Runs 'bun run app'
fnode cli [options..]    # Runs 'bun run cli'
```

The same commands are available for `fnet` as well.

##### Cloud Development Commands

```bash
# Run AWS CLI commands in the project context
fnode aws [commands..]
fnet aws [commands..]

# Run AWS CDK commands in the project context
fnode cdk [commands..]
fnet cdk [commands..]
```

#### Runtime-Specific Commands

The `fnode` CLI supports additional commands for Python projects:

```bash
# Run Python commands using the project's Conda environment
fnode python [commands..]
fnode python3 [commands..]

# Run pip commands using the project's Conda environment
fnode pip [commands..]
fnode pip3 [commands..]
```

These commands use the Conda environment in the project's `.workspace/.conda` directory.

#### Tag Support with --ftag

Both CLI tools support the `--ftag` parameter for powerful conditional configuration. This feature allows you to define environment-specific settings in a single project file:

```bash
fnode build --ftag dev --ftag local
```

This activates sections in your project file marked with `t::dev::` or `t::local::` tags. For example:

```yaml
# Base configuration (always applied)
name: my-project
version: 1.0.0

# Development environment configuration
t::dev::database:
  url: "mongodb://localhost:27017"
  logging: true

# Production environment configuration
t::prod::database:
  url: "mongodb://production-server:27017"
  logging: false
  replicas: 3

# Feature flags
t::experimental::features:
  newUI: true
```

When you run a command with `--ftag dev`, only the sections marked with `t::dev::` will be activated and merged with the base configuration. If you run with `--ftag prod`, the production settings will be used instead.

You can specify multiple tags, and any section marked with any of those tags will be activated (OR logic). This powerful feature allows you to:

- Maintain different configurations for development, staging, and production in a single file
- Enable or disable features conditionally
- Create specialized builds for different environments
- Test new features without affecting the main configuration

The `--ftag` parameter can be used with most CLI commands, including `build`, `deploy`, `run`, and others.

##### Potential Opportunities with Tag-Based Configuration

This powerful tag-based configuration system opens up numerous possibilities:

1. **DevOps and CI/CD Integration**
   - Run the same codebase with different configurations in your CI/CD pipeline
   - Maintain a single source of truth for all environment configurations

2. **Feature Flags**
   - Gradually roll out new features to specific environments or user groups
   - Implement A/B testing with different configurations for different user segments

3. **Multi-Deployment Strategies**
   - Create region-specific configurations (EU, US, Asia)
   - Develop customer-specific deployments with tailored features

4. **Development Workflow Improvements**
   - Enable performance optimizations or debugging features in development
   - Define team-specific configurations for better collaboration

5. **Experimental Features and Prototyping**
   - Test experimental code without affecting the main codebase
   - Quickly prototype different approaches with alternative configurations

6. **Conditional Dependency Management**
   - Define different dependencies for different environments
   - Include development tools only in development builds

7. **Security and Compliance**
   - Create security profiles with different encryption requirements
   - Implement compliance-specific configurations (GDPR, HIPAA, etc.)

8. **Performance Optimizations**
   - Define scaling profiles for different load scenarios
   - Optimize resource usage based on the deployment environment

By leveraging tags, you can create highly adaptable applications that adjust their behavior based on the context in which they run.

#### Key Differences

1. **Runtime Support**: `fnode` supports three runtimes (Node.js, Python, Bun), while `fnet` only supports Node.js
2. **Project File**: `fnode` uses `fnode.yaml`, `fnet` uses `fnet.yaml`, `frun` auto-detects either file
3. **Builder Classes**: `fnode` uses runtime-specific builders (node, python, bun), `fnet` uses `wf-builder.js`
4. **Template Directories**: `fnode` uses `template/fnode`, `fnet` uses `template/fnet`
5. **Conda Commands**: Only `fnode` supports Conda commands for Python projects
6. **Command Scope**: `fnode` and `fnet` are project-specific, while `frun` works with both project types

### Project Code Structure

When thinking about Flownet projects, the `src` folder should be your primary focus. This is where all your functional code resides. Flownet recommends a flat file structure for better simplicity and maintainability.

```text
# For fnode projects (typically a single code file)
my-fnode-project/
├── src/
│   └── index.js          # Your functional code in a single file
├── fnode.yaml            # Project configuration file
└── .workspace/           # Build infrastructure (managed by CLI)

# For fnet (workflow) projects
my-fnet-project/
├── src/
│   └── local/            # Optional local code used in workflows
│       └── helpers.js    # Helper functions for workflows
├── fnet.yaml             # Project configuration file
├── fnet/
│   └── flows.yaml        # Workflow definitions
└── .workspace/           # Build infrastructure (managed by CLI)
```

As a developer, you'll spend most of your time working in the `src` directory, while the CLI tools manage everything else. The flat file structure keeps your code simple and focused on functionality.

### Isolated Workspace

Flownet uses a clear separation between functional code and build infrastructure:

- **`.workspace` Directory**: This is the isolated space where all build/run operations happen
- **Functional Code**: Resides in the parent directory (typically the `src` folder)

This separation ensures that developers only need to focus on the functional code while all the complexity of building, running, and deploying is contained within the `.workspace` directory.

## The Binary System

The Flownet binary system is designed to make CLI tools more efficient and easier to distribute. It provides a complete solution for compiling, installing, and managing binaries.

### How It Works

The binary system consists of several components:

1. **Bin Directory**: A dedicated directory (`~/.fnet/bin`) for storing compiled binaries
2. **Metadata Storage**: Keeps track of installed binaries, their versions, and sources
3. **PATH Integration**: Automatically adds the bin directory to your PATH
4. **Compilation Tools**: Uses Bun's compilation capabilities for creating native binaries
5. **Project Integration**: Seamlessly works with `fnode` and `fnet` projects

### Binary System Features

- **Fast Startup**: Pre-compiled binaries start much faster than interpreted scripts
- **Cross-Platform Support**: Works on macOS, Linux, and Windows
- **Multiple Shell Support**: Compatible with Bash, Zsh, Fish, PowerShell, and more
- **Version Management**: Keeps track of binary versions and metadata
- **Project Integration**: Easily compile and install CLI-enabled projects
- **Automation Support**: All commands support the `--yes` flag for scripting

### Usage Examples

```bash
# Compile a JavaScript file to a binary
fbin compile script.js -o my-tool

# Install a compiled binary
fbin install ./my-tool --name awesome-tool

# Install a CLI-enabled project
cd my-project
fnode install

# List installed binaries
fbin list

# Uninstall a binary
fbin uninstall awesome-tool
```

The binary system makes it easy to create, distribute, and manage CLI tools, significantly improving the developer experience.

## Express Command

The `express` command suite is designed to provide developers with a quick way to create, manage, and access test projects without the hassle of managing project directories. It works with projects in a dedicated location (`~/.fnet/express`) for easy access and management.

### Express Command Features

- **Quick Project Creation**: Create test projects with a single command
- **Automatic Organization**: Projects are organized by date for easy reference
- **Multiple Runtime Support**: Create projects with Node.js, Python, or Bun runtimes
- **Interactive Interface**: Guided prompts for project creation and management
- **IDE Integration**: Automatically open projects in your preferred IDE
- **Project Promotion**: Easily move test projects to production-ready locations

### Basic Usage

```bash
# Create a quick test project
fnode express

# Create a project with a specific name
fnode express my-test-project

# Create a project with a specific runtime
fnode express --runtime python

# List all express projects
fnode express list

# Open a specific project
fnode express open my-test-project

# Open the most recent project
fnode express open --latest

# Move a project to a production location
fnode express move my-test-project ~/projects/production
```

The express command makes it easy to quickly create and manage test projects, significantly improving developer productivity.

## Benefits

This approach creates a more efficient development experience:

- **Enhanced Focus**: Developers spend time on business logic, not configuration files
- **Increased Productivity**: Less time wasted on boilerplate and infrastructure setup
- **AI-Friendly Development**: AI agents can focus on generating functional code without needing to understand complex infrastructure details
- **Flexibility**: The same core component can be used in different contexts (CLI, browser) without code duplication
- **Clean Project Structure**: Clear separation between functional code and build infrastructure
- **Efficient CLI Tools**: Fast startup times and easy distribution of compiled binaries
- **Cross-Platform Compatibility**: Works seamlessly across different operating systems and shells
- **Quick Testing**: Express command for rapid project creation and testing

By isolating the functional core from everything else and providing powerful tools for distribution, Flownet transforms how we approach software development, making it more efficient and focused on what truly matters.
