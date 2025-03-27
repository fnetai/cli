# :warning: Warning

This tool is in its early stages of development. Changes in its usage are highly likely. Please use with caution.


# @fnet/cli: Flow Node & Flow Project Setup Guide

## Overview

The `@fnet/cli` is a command-line interface tool designed to facilitate the development and deployment of flow-based projects within the fnet ecosystem. It simplifies the processes of creating, managing, and deploying flow-based projects, acting as a bridge between developers and the fnet platform.

## Prerequisites

Ensure you have `@fnet/cli` installed globally:
```bash
npm i @fnet/cli -g
```

Upon installation, two binary commands become available: `fnet` (for flow projects) and `fnode` (for flow node projects).

## Identifying Project Type

- Flow Node Project: Presence of `node.yaml`. Use `fnode` commands.
- Flow Project: Presence of `fnet.yaml`. Use `fnet` commands.

## Building the Project

For Flow Node:
```bash
fnode build
```

For Flow:
```bash
fnet build
```

Both commands generate a `.workspace` directory with files and configurations for debugging, building, and deploying.

## Watching the Project (Development Mode)

For Flow Node:
```bash
fnode watch
```

For Flow:
```bash
fnet watch
```