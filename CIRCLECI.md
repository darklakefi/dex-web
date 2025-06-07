# CircleCI: Continuous Integration & Deployment

This document explains how CircleCI is used in this repository, including pipeline structure, local testing, troubleshooting, and best practices.

## Table of Contents
- [Pipeline Overview](#pipeline-overview)
- [Pipeline Statuses](#pipeline-statuses)
- [Local Pipeline Testing](#local-pipeline-testing)
- [Key Features](#key-features)
- [Best Practices](#best-practices)

---

## Pipeline Overview

The CI/CD pipeline includes:

- Running tests across affected projects
- Building production bundles
- Running E2E tests
- Deploying to staging/production
- Caching dependencies for faster builds

You can view build status and logs at [CircleCI Dashboard](https://app.circleci.com/).

## Pipeline Statuses

| Status     | Meaning                   |
| ---------- | ------------------------- |
| ✅ Success | All checks passed         |
| ❌ Failed  | One or more checks failed |
| ⏳ Running | Pipeline in progress      |

## Local Pipeline Testing

To test the pipeline locally:

1. **Install CircleCI CLI:**

   - **macOS/Linux:**
     ```sh
     curl -fLSs https://raw.githubusercontent.com/CircleCI-Public/circleci-cli/master/install.sh | bash
     ```
   - **Homebrew (macOS):**
     ```sh
     brew install circleci
     ```

2. **Verify Docker:**

   ```sh
   docker info
   ```

   > Note: Docker Desktop or daemon must be running

3. **Execute Pipeline:**
   ```sh
   circleci local execute main
   ```

## Key Features

- **Component Development**: Build and test components in isolation
- **Documentation**: Auto-generated documentation for components
- **Visual Testing**: Compare component states and catch visual regressions
- **Interactive Testing**: Test component interactions and states

## Best Practices

- Write stories for all reusable components
- Include component documentation and usage examples
- Use controls to demonstrate different component states
- Add relevant component props and their descriptions
