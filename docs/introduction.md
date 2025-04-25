# Introduction to @fnet/cli

## The Vision Behind @fnet/cli

@fnet/cli is built on a simple yet powerful vision: **isolate all non-functional components so developers can focus solely on functional code**.

Think about it - even for a simple "Hello World!" application that you want to deploy, how many different files and configurations do you need beyond your actual functional code? Package managers, build tools, deployment configurations, and more - these non-functional components often require significant time and attention, distracting from the core business logic.

## The Core Philosophy

The fundamental philosophy of @fnet/cli is that **all non-functional components should be regenerable**.

This means developers and AI agents can focus exclusively on writing the functional code that delivers actual value, while @fnet/cli handles everything else automatically.

## How @fnet/cli Works

### Project Types: Workflow vs Node

@fnet/cli supports two main project types, independent of the underlying runtime:

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

As a developer, you only need to know these two commands and their options. The internal implementation details (like `lib-cli.js` or `wf-cli.js`) are abstracted away, allowing you to focus solely on your project's functional code.

#### Core Commands

Both CLI tools share similar command structures but serve different project types:

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
fnode run <command-group> [--ftag <tags>]
fnet run <command-group> [--ftag <tags>]
```

This executes command groups defined in the `commands` section of your project file.

##### Environment-Aware Command Execution

```bash
# Run a command with environment variables from a config file
fnode with <config> <command> [options..]
fnet with <config> <command> [options..]
```

This runs a command with environment variables from a specified configuration file.

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

#### Tag Support

Both CLI tools support the `--ftag` parameter for conditional configuration:

```bash
fnode build --ftag dev --ftag local
```

This activates sections in your project file marked with `t::dev::` or `t::local::` tags.

#### Key Differences

1. **Runtime Support**: `fnode` supports three runtimes (node, python, bun), while `fnet` only supports node
2. **Project File**: `fnode` uses `fnode.yaml`, `fnet` uses `fnet.yaml`
3. **Builder Class**: `fnode` uses `lib-builder.js`, `fnet` uses `wf-builder.js`
4. **Template Directories**: `fnode` uses `template/fnode`, `fnet` uses `template/fnet`
5. **Conda Commands**: Only `fnode` supports Conda commands for Python projects

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

## Benefits

This approach creates a more efficient development experience:

- **Enhanced Focus**: Developers spend time on business logic, not configuration files
- **Increased Productivity**: Less time wasted on boilerplate and infrastructure setup
- **AI-Friendly Development**: AI agents can focus on generating functional code without needing to understand complex infrastructure details
- **Flexibility**: The same core component can be used in different contexts (CLI, browser) without code duplication
- **Clean Project Structure**: Clear separation between functional code and build infrastructure

By isolating the functional core from everything else, @fnet/cli transforms how we approach software development, making it more efficient and focused on what truly matters.
