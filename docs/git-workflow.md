# Complete Git Workflow Guide

## Table of Contents

1. [Overview](#overview)
2. [Quick Start Guide](#quick-start-guide)
3. [Detailed Workflow](#detailed-workflow)
4. [Practical Examples](#practical-examples)
5. [Quality Assurance](#quality-assurance)
6. [Emergency Procedures](#emergency-procedures)
7. [Tools and Configuration](#tools-and-configuration)
8. [Best Practices](#best-practices)

## Overview

This document provides a comprehensive git workflow for the Crefy Connect Backend project, built around your existing TypeScript setup with quality tools (ESLint, Prettier, Jest, Husky, etc.).

### Key Features

-   ✅ **Automated Quality Checks** via Husky hooks
-   ✅ **GitHub Actions CI/CD** for testing and deployment
-   ✅ **Conventional Commits** with commitlint validation
-   ✅ **Semantic Versioning** for releases
-   ✅ **Docker Support** for consistent deployments
-   ✅ **Issue and PR Templates** for standardized processes

## Quick Start Guide

### First Time Setup

```bash
# Clone the repository
git clone https://github.com/your-org/crefy-connect-backend.git
cd crefy-connect-backend

# Install dependencies
pnpm install

# Setup git hooks (automatically done by prepare script)
pnpm prepare

# Verify setup
pnpm validate
```

### Daily Development Flow

```bash
# Start your day
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Develop and commit (hooks will run automatically)
git add .
git commit -m "feat: add your feature description"

# Push to create PR
git push origin feature/your-feature-name
# Then create PR via GitHub UI
```

## Detailed Workflow

### Branching Strategy

We use a **GitFlow-inspired** approach with these branch types:

#### Main Branches

-   **`main`** - Production-ready code, always stable
-   **`develop`** - Integration branch for ongoing development

#### Supporting Branches

```bash
# Feature branches - for new features
feature/ens-integration
feature/email-authentication

# Bugfix branches - for non-production bugs
bugfix/api-timeout-fix

# Hotfix branches - for production issues
hotfix/critical-security-patch

# Release branches - for version releases
release/v1.2.0
```

### Commit Message Format

Follow **Conventional Commits** specification:

```bash
# Format: type(scope): description

# Examples:
feat(auth): add email authentication endpoint
fix(api): resolve timeout issue in wallet service
docs(readme): update installation instructions
style(lint): fix formatting in auth-controller
refactor(service): simplify ENS subname logic
test(ens): add integration tests for subname registration
chore(deps): update TypeScript to v5.9.3
perf(api): optimize database queries
ci(workflow): add deployment automation
```

### Pull Request Process

1. **Create PR** - Use GitHub UI with the provided template
2. **Automated Checks** - CI pipeline runs automatically
3. **Code Review** - At least 1 reviewer for features, 2 for production
4. **Merge** - Squash and merge to maintain clean history

## Practical Examples

### Example 1: Adding a New Feature

```bash
# 1. Start from latest develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/push-notifications

# 3. Develop your feature
# ... make changes ...

# 4. Commit with proper format
git add .
git commit -m "feat(api): add push notification endpoints

- POST /api/notifications/subscribe
- POST /api/notifications/unsubscribe
- POST /api/notifications/send

Closes #123"

# 5. Push and create PR
git push origin feature/push-notifications
```

### Example 2: Bug Fix

```bash
# 1. Create bugfix branch
git checkout develop
git checkout -b bugfix/email-validation-error

# 2. Fix the issue
# ... make changes ...

# 3. Add tests for the fix
# ... write tests ...

# 4. Commit
git add .
git commit -m "fix(email): resolve validation error for special characters

- Updated email regex pattern
- Added test cases for edge scenarios
- Validated with sample emails

Fixes #456"

# 5. Push and create PR
git push origin bugfix/email-validation-error
```

### Example 3: Emergency Hotfix

```bash
# 1. Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-database-connection

# 2. Fix the critical issue
# ... make minimal fix ...

# 3. Commit with urgency marker
git add .
git commit -m "hotfix(db): fix connection pool exhaustion

- Increased pool size limits
- Added connection retry logic
- Immediate deployment required

Refs #789"

# 4. Test thoroughly
pnpm test:ci
pnpm build

# 5. Create emergency PR with expedited review
# 6. After merge, tag and release
git tag v1.2.1
git push origin v1.2.1
```

### Example 4: Release Process

```bash
# 1. Create release branch
git checkout develop
git checkout -b release/v1.3.0

# 2. Prepare release
npm version minor  # Updates package.json version
git add .
git commit -m "chore(release): prepare v1.3.0"

# 3. Test release branch
pnpm validate

# 4. Merge to main
git checkout main
git merge release/v1.3.0
git tag v1.3.0

# 5. Merge back to develop
git checkout develop
git merge release/v1.3.0

# 6. Clean up
git branch -d release/v1.3.0
git push origin main develop --tags
```

## Quality Assurance

### Pre-commit Hooks (Automatic)

Your Husky setup automatically runs:

```bash
✅ ESLint - Code quality and style
✅ Prettier - Code formatting
✅ TypeScript - Type checking
✅ Jest - Unit tests
✅ Commitlint - Commit message validation
```

### Pre-push Hooks (Automatic)

```bash
✅ Full TypeScript compilation
✅ Complete ESLint validation
✅ Full test suite execution
```

### Manual Quality Checks

```bash
# Before creating PR
pnpm validate          # Run all checks
pnpm build            # Ensure build works
pnpm test:ci          # Full test suite

# Before pushing
pnpm lint:check       # Quick lint check
pnpm type-check       # Type safety check
```

## Emergency Procedures

### Production Incident Response

#### Step 1: Immediate Response (15 minutes)

```bash
# Create hotfix branch
git checkout main
git checkout -b hotfix/critical-issue-description

# Implement minimal fix
# Focus on symptoms, not root cause yet
```

#### Step 2: Testing (30 minutes)

```bash
# Focused testing on affected areas
pnpm test -- --testPathPattern=affected-module
pnpm type-check
```

#### Step 3: Deploy Fix (1 hour)

```bash
# Create PR with expedited review
# Deploy using manual trigger if needed
# Monitor error rates and performance
```

#### Step 4: Post-Incident (24 hours)

```bash
# Create follow-up issues for root cause
# Document incident and resolution
# Update monitoring and alerting
# Conduct blameless postmortem
```

### Communication Protocol

-   **Slack**: #engineering-alerts (immediate)
-   **Email**: dev-team@company.com (incident log)
-   **Documentation**: Update runbooks immediately

## Tools and Configuration

### GitHub Actions Workflows

1. **CI Pipeline** (`.github/workflows/ci.yml`)

    - Quality checks on Node.js 18 and 20
    - Security audit
    - Test coverage
    - Build verification

2. **Release Management** (`.github/workflows/release.yml`)

    - Automatic versioning
    - NPM publishing
    - GitHub releases
    - Change log generation

3. **Deployment** (`.github/workflows/deploy.yml`)
    - Staging and production deployments
    - Health checks
    - Rollback capabilities
    - Environment-specific configs

### Required GitHub Secrets

```bash
# For release workflow
NPM_TOKEN           # NPM publishing
SLACK_WEBHOOK_URL   # Release notifications

# For deployment workflow
DOCKER_REGISTRY     # Container registry URL
DOCKER_REGISTRY_USERNAME
DOCKER_REGISTRY_PASSWORD
```

### VS Code Extensions (Recommended)

```json
{
    "recommendations": [
        "ms-vscode.vscode-typescript-next",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "eamodio.gitlens",
        "donjayamanne.githistory",
        "ms-vscode.vscode-json"
    ]
}
```

## Best Practices

### Code Review Guidelines

#### For Reviewers

-   [ ] Code follows style guidelines (automatically checked)
-   [ ] Tests are comprehensive (≥80% coverage)
-   [ ] Documentation is updated
-   [ ] No security vulnerabilities
-   [ ] Performance impact considered
-   [ ] Error handling is robust
-   [ ] Business logic is sound

#### For Authors

-   [ ] Keep PRs focused and small (<400 lines when possible)
-   [ ] Write clear, descriptive titles and descriptions
-   [ ] Link related issues
-   [ ] Respond to feedback within 24 hours
-   [ ] Test thoroughly before requesting review
-   [ ] Be available for questions during review

### Commit Message Guidelines

#### Good Commit Messages

```bash
feat(api): add rate limiting to wallet endpoints
fix(auth): resolve token refresh race condition
docs(readme): add troubleshooting section
test(wallet): add integration tests for transaction flow
```

#### Avoid These

```bash
feat: add stuff         # Too vague
fix: bug fix           # No context
wip: more changes      # Unclear purpose
Update file.ts         # No action specified
```

### Branch Management

#### Before Starting Work

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature
```

#### Before Creating PR

```bash
git fetch origin
git merge origin/develop  # or git rebase origin/develop
pnpm validate            # Ensure all checks pass
```

#### After PR Approval

```bash
# Squash and merge via GitHub UI
# Then clean up your local branch
git checkout develop
git pull origin develop
git branch -d feature/your-feature
```

### Getting Help

-   **Git Issues**: Create detailed issue with reproduction steps
-   **Team Questions**: Use #engineering-help Slack channel
-   **Architecture**: Schedule architecture review session
-   **Emergency**: Page on-call engineer via #engineering-alerts

---

## Summary

This workflow is designed to:

-   ✅ **Ensure Code Quality** through automated checks
-   ✅ **Enable Safe Collaboration** via structured processes
-   ✅ **Support Rapid Development** with minimal friction
-   ✅ **Maintain Production Stability** through careful release management
-   ✅ **Facilitate Team Communication** through clear conventions

Remember: The workflow is there to help, not hinder. When in doubt, ask for help rather than breaking production code!
