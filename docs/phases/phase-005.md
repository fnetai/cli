# Phase 005: Flownet CLI Entry Points Analysis

## Objective

This phase aims to analyze the CLI entry points provided by the Flownet CLI project when published, understanding their functionality, purpose, and how they interact with each other.

## Phase Type

- **Knowledge Phase**: Research-only phase that informs future development

## Approach

1. Research the core concepts thoroughly
2. Analyze the package.json and CLI source code
3. Document findings in a clear, structured manner
4. Focus on practical applications and user experience

## Checklist

- [x] Research Preparation
  - [x] Review package.json bin entries
  - [x] Examine CLI source code structure
- [x] Core Research
  - [x] Identify all CLI entry points
  - [x] Analyze the purpose and functionality of each entry point
  - [x] Understand how the entry points interact with each other
  - [x] Examine the command structure of each CLI tool
  - [x] Investigate how the CLI tools are published and installed
- [x] Documentation
  - [x] Create concise research document
  - [x] Link from this phase document
  - [x] Add link to this phase in `./phases/index.md`
  - [x] Add link to research document in `./research/index.md`

## Summary

The research phase for the Flownet CLI entry points has been completed successfully. We have analyzed the CLI tools provided by the Flownet CLI project when published.

Key findings:

- The Flownet CLI project provides **four distinct CLI entry points** when published: `fnode`, `fnet`, `frun`, and `fbin`
- Each CLI tool serves a specific purpose in the Flownet ecosystem:
  - `fnode`: Manages Node/classic projects (uses `fnode.yaml`)
  - `fnet`: Manages Workflow projects (uses `fnet.yaml`)
  - `frun`: Provides a unified interface for running command groups from project files (works with both project types)
  - `fbin`: Manages the binary system for installing, compiling, and distributing CLI tools
- The CLI tools are defined in the `bin` field of the package.json file and point to their respective entry points in the dist directory
- All four CLI tools are installed globally when the @fnet/cli package is installed via npm, yarn, or bun
- The CLI tools share similar command structures but have specialized commands based on their purpose
- Projects created with these tools can also be compiled into standalone binaries using the `fbin` tool

Recommendations for implementation:

- Maintain consistent command structures across all CLI tools for better user experience
- Provide clear documentation for each CLI tool and its commands
- Consider adding more cross-tool functionality to enhance the ecosystem
- Implement comprehensive error handling and user feedback
- Ensure backward compatibility when making changes to the CLI tools

Link to detailed research document: [Flownet CLI Entry Points Analysis](../research/flownet-cli-entry-points.md)

## Related Phases

- [Phase 001: @fnet/yaml Package Analysis](./phase-001.md)
- [Phase 002: @fnet/config Package Analysis](./phase-002.md)
- [Phase 003: @fnet/shell-flow Package Analysis](./phase-003.md)
- [Phase 004: @fnet/service Package Analysis](./phase-004.md)
- [Future phases that will build on this research]
