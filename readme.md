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
- Flow Project: Presence of `flow.yaml`. Use `fnet` commands.

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

## Deploying the Project

Ensure respective `node.devops.yaml` (for Flow Node) or `flow.devops.yaml` (for Flow) has the correct deployment configurations.

### Configuration for NPM Deployment

**Structure for devops.yaml:**

```yaml
targets:
  - name: npm
    enabled: true
    params:
        name: "NPM_PACKAGE_NAME"
        version: "NPM_VERSION"
```
Replace placeholders with desired npm package name and version.

For deployment:

For Flow Node:
```bash
fnode deploy
```

For Flow:
```bash
fnet deploy
```

**NPM Configuration File:**

The CLI checks for `npm.fnet` under the first `.fnet` directory (in the project root, parent directory, or user's home). The file format:

```yaml
version: 1
type: fnet.config
env:
  NPM_TOKEN: "YOUR_NPM_TOKEN"
```
Replace `YOUR_NPM_TOKEN` with your npm token for deployment authentication.

### Configuration for GCS Deployment

The `@fnet/cli` also facilitates deploying build packages directly to a Google Cloud Storage bucket.

To deploy to a Google Cloud Storage bucket, add a new target named `gcs` under the `targets` section in your `devops.yaml`:

```yaml
targets:
  ...
  - name: gcs
    enabled: true
    params:
      name: "@flownet/lib-1"
      version: 0.1.2
```

Replace the placeholders with your package name and version accordingly.

### GCS Configuration File:

For GCS deployment, the CLI looks for a `gcs.fnet` file under the first `.fnet` directory (either in the project root, parent directory, or user's home directory). The expected format of this file is:

```yaml
version: 1
type: fnet.config
env:
  GCS_PROJECT_ID: "YOUR_PROJECT_ID"
  GCS_BUCKET_NAME: "YOUR_BUCKET_NAME"
  GCS_UPLOADER_KEY_FILE: "PATH_TO_YOUR_SERVICE_ACCOUNT_KEY_JSON"
```

Make sure to replace the placeholders with the appropriate values:

- `YOUR_PROJECT_ID`: Your Google Cloud project ID.
- `YOUR_BUCKET_NAME`: The name of the GCS bucket where you want to deploy.
- `PATH_TO_YOUR_SERVICE_ACCOUNT_KEY_JSON`: Path to the service account key in JSON format, which has the necessary permissions to upload files to the specified bucket.

### Configuration for GitLab Deployment

With the `@fnet/cli`, you can also deploy the contents of the `.workspace` directory directly to GitLab.

To deploy to GitLab, introduce a new target named `gitlab` under the `targets` section in your `devops.yaml`:

```yaml
targets:
  ...
  - name: gitlab
    enabled: true
    params:
      name: PROJECT-NAME
      branch: BRANCH-NAME
```

Replace `PROJECT-NAME` with the name of your GitLab project and `BRANCH-NAME` with the branch where you want to deploy the contents.

### GitLab Configuration File:

For the GitLab deployment, the CLI searches for a `gitlab.fnet` file under the first `.fnet` directory (either in the project root, parent directory, or user's home directory). The expected format for this file is:

```yaml
version: 1
type: fnet.config
data:
  projectGroupId: "YOUR_PROJECT_GROUP_ID"
  gitlabHost: "YOUR_GITLAB_HOST"
  gitlabToken: "YOUR_GITLAB_TOKEN"
  gitlabUsername: "YOUR_USERNAME"
  gitlabUserEmail: "YOUR_EMAIL"
```

Make sure to replace the placeholders with the appropriate values:

- `YOUR_PROJECT_GROUP_ID`: The ID of your GitLab project group.
- `YOUR_GITLAB_HOST`: The hostname of your GitLab instance (e.g., "gitlab.com" for GitLab's public instance).
- `YOUR_GITLAB_TOKEN`: Your GitLab personal access token.
- `YOUR_USERNAME`: Your GitLab username.
- `YOUR_EMAIL`: The email associated with your GitLab account.