# Phase 007: 'frun' CLI Usage Research

## Objective

This phase aims to analyze the 'frun' CLI entry point from an end-user perspective, understanding how users would interact with this unified command-line interface for both fnode and fnet projects, and documenting the optimal user experience for this tool.

## Phase Type

- **Knowledge Phase**: Research-only phase that informs future development

## Approach

1. Research the current command execution patterns in fnode and fnet projects
2. Analyze user workflows and common use cases
3. Document the ideal user experience for the 'frun' CLI tool
4. Focus on practical applications and developer experience

## Checklist

- [x] Research Preparation
  - [x] Examine current 'fnode run' and 'fnet run' command implementations
  - [x] Identify common patterns and differences between them
  - [x] Review user memories and preferences related to command execution
- [x] Core Research
  - [x] Analyze how users would interact with a unified 'frun' command
  - [x] Determine optimal command-line arguments and flags
  - [x] Explore how 'frun' would handle different project types
  - [x] Investigate integration with project configuration files
  - [x] Consider how 'frun' would support different CLI modes (standard, MCP, HTTP)
  - [x] Analyze how 'frun' would handle command groups from project files
- [x] Documentation
  - [x] Create concise research document
  - [x] Link from this phase document
  - [x] Add link to this phase in `./phases/index.md`
  - [x] Add link to research document in `./research/index.md`

## Summary

The research phase for the 'frun' CLI entry point from an end-user perspective has been completed successfully. We have analyzed how users would interact with this unified command-line interface for both fnode and fnet projects.

Key findings:

- The 'frun' CLI tool is **already implemented** in the codebase and provides a unified interface for executing commands across different project types
- Based on the `frun --help` output, it supports a simple command structure: `frun <command> [options]`
- It supports **positional command group parameter** and **--ftag option** for conditional configuration
- The tool **already supports automatic project type detection**, checking for fnode.yaml or fnet.yaml in the current directory
- It currently supports **command group execution** from project configuration files
- From a user workflow perspective, the tool already simplifies common development tasks like running, testing, and building projects

Link to detailed research document: [frun CLI Usage Research](../research/frun-cli-usage.md)

## Related Phases

- [Phase 001: @fnet/yaml Package Analysis](./phase-001.md)
- [Phase 002: @fnet/config Package Analysis](./phase-002.md)
- [Phase 003: @fnet/shell-flow Package Analysis](./phase-003.md)
- [Phase 004: @fnet/service Package Analysis](./phase-004.md)
- [Phase 005: Flownet CLI Entry Points Analysis](./phase-005.md)
- [Phase 006: Template Directory Analysis](./phase-006.md)
- [Future phases that will build on this research]
