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

- **Workflow Projects (`fnet`)**: Designed for workflow-oriented applications with a focus on process flows and transformations
- **Node Projects (`fnode`)**: Used for more traditional/classic project structures (not to be confused with Node.js)

This distinction allows developers to choose the project structure that best fits their needs and use cases.

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
