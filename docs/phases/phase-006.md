# Phase 006: Template Directory Analysis

## Objective

This phase aims to analyze the purpose, structure, and usage of the template directory in the Flownet CLI project, understanding how templates are organized, rendered, and utilized in the project creation and management process.

## Phase Type

- **Knowledge Phase**: Research-only phase that informs future development

## Approach

1. Research the template directory structure thoroughly
2. Analyze how templates are used in the codebase
3. Document findings in a clear, structured manner
4. Focus on practical applications and developer experience

## Checklist

- [x] Research Preparation
  - [x] Examine template directory structure
  - [x] Identify template file types and formats
- [x] Core Research
  - [x] Analyze the organization of templates by project type and runtime
  - [x] Understand the template rendering process
  - [x] Identify the code that uses templates
  - [x] Examine how templates support different project features
  - [x] Investigate template customization and extension mechanisms
- [x] Documentation
  - [x] Create concise research document
  - [x] Link from this phase document
  - [x] Add link to this phase in `./phases/index.md`
  - [x] Add link to research document in `./research/index.md`

## Summary

The research phase for the template directory in the Flownet CLI project has been completed successfully. We have analyzed the purpose, structure, and usage of the template directory.

Key findings:

- One of the most important goals of Flownet CLI is to **isolate non-functional components from developers**, allowing them to focus solely on functional code
- This is achieved through the `.workspace` pattern, where functional code lives in the parent directory while all build/run operations are contained in the `.workspace` directory
- The template directory serves as a **centralized repository of project templates** used by the Flownet CLI tools to generate new projects and project components
- The directory is organized hierarchically with main sections for different project types (`fnode` and `fnet`), which are further divided by runtime environments (`node`, `bun`, `python`)
- **Multi-runtime support** is a key feature, with Node/classic projects (fnode) supporting Node.js, Bun, and Python, while workflow projects (fnet) currently support primarily Node.js
- Templates use the **Nunjucks templating engine** (`.njk` files) to provide dynamic content generation based on project configuration
- The template system supports various project features including CLI tools, web applications, and different module formats (ESM, CJS)
- Templates are rendered using the `@flownet/lib-render-templates-dir` library, which processes Nunjucks templates with context data
- The template system is not just a convenience but a **core enabler of Flownet CLI's philosophy** of separating functional and non-functional code

Recommendations for implementation:

- Maintain consistent template structure and naming conventions
- Document template variables and context objects for easier maintenance
- Consider implementing template versioning for backward compatibility
- Develop a testing framework for templates to ensure they generate valid code
- Explore opportunities for template customization by end users
- Implement template validation to catch errors early in the development process

Link to detailed research document: [Template Directory Analysis](../research/template-directory-analysis.md)

## Related Phases

- [Phase 001: @fnet/yaml Package Analysis](./phase-001.md)
- [Phase 002: @fnet/config Package Analysis](./phase-002.md)
- [Phase 003: @fnet/shell-flow Package Analysis](./phase-003.md)
- [Phase 004: @fnet/service Package Analysis](./phase-004.md)
- [Phase 005: Flownet CLI Entry Points Analysis](./phase-005.md)
- [Future phases that will build on this research]
