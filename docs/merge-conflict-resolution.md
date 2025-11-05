# Merge Conflict Resolution Guide

## Table of Contents

1. [Prevention Strategies](#prevention-strategies)
2. [Common Conflict Scenarios](#common-conflict-scenarios)
3. [Step-by-Step Resolution Process](#step-by-step-resolution-process)
4. [Tools and Commands](#tools-and-commands)
5. [Best Practices](#best-practices)

## Prevention Strategies

### 1. Regular Sync

```bash
# Keep your feature branch updated with develop
git checkout feature/your-feature
git fetch origin
git merge origin/develop  # or git rebase origin/develop
```

### 2. Small, Focused PRs

-   Keep changes focused and atomic
-   Avoid multiple unrelated changes in one PR
-   Break large features into smaller PRs

### 3. Communication

-   Coordinate with team members on shared files
-   Use branch protection rules
-   Set up code owners for critical files

## Common Conflict Scenarios

### Scenario 1: Simultaneous Edits to Same File

**Conflict:** Two developers modified the same lines in the same file

**Resolution:**

```bash
# 1. Update your branch
git checkout feature/your-feature
git fetch origin
git merge origin/develop

# 2. Resolve conflicts in the file
# Open the file and resolve the conflicts marked by <<<<<<<, =======, >>>>>>>

# 3. Stage and commit
git add .
git commit -m "resolve: merge conflict in auth-controller"

# 4. Push resolved changes
git push origin feature/your-feature
```

### Scenario 2: File Deleted in One Branch, Modified in Another

**Resolution:**

```bash
# 1. Check the status
git status

# 2. Choose to keep the file or remove it
# To keep the file:
git add filename.ts

# To remove the file:
git rm filename.ts

# 3. Commit the resolution
git commit -m "resolve: choose to keep/remove deleted file"
```

### Scenario 3: Rename Conflict

**Resolution:**

```bash
# Use git status to see the situation
git status

# Check the diff
git diff --name-status

# Resolve by choosing the correct version
git add new-filename.ts
git rm old-filename.ts

git commit -m "resolve: rename conflict resolution"
```

## Step-by-Step Resolution Process

### 1. Identify Conflicts

```bash
# After a merge/rebase fails, check status
git status
git diff --name-status
```

### 2. Understand the Conflict

```bash
# See the actual conflicts
git diff

# Or use VS Code's merge conflict resolution
code .
```

### 3. Resolve Each Conflict

#### Manual Resolution

1. Open the conflicted file
2. Look for conflict markers:
    ```
    <<<<<<< HEAD
    your current changes
    =======
    incoming changes
    >>>>>>> feature-branch
    ```
3. Choose which version to keep or combine both
4. Remove the conflict markers
5. Test the resolved code

#### Using Git Commands

```bash
# Accept current change (HEAD)
git checkout --ours filename.ts

# Accept incoming change
git checkout --theirs filename.ts

# Accept both changes (manual resolution needed)
git checkout --conflict=diff3 filename.ts
```

### 4. Complete the Resolution

```bash
# Add resolved files
git add .

# If it was a merge
git commit -m "resolve: merge conflicts between develop and feature/xxx"

# If it was a rebase
git rebase --continue
```

### 5. Test Thoroughly

```bash
# Run your test suite
pnpm test

# Run linting
pnpm lint:check

# Run type checking
pnpm type-check

# Build the project
pnpm build
```

## Tools and Commands

### Git Commands

```bash
# Start a merge
git merge feature-branch

# Abort a merge if things go wrong
git merge --abort

# Continue after resolving conflicts
git commit

# During rebase
git rebase --continue
git rebase --abort
git rebase --skip
```

### VS Code Extensions

-   **GitLens** - Better git history and conflict visualization
-   **Git Graph** - Visual git history
-   **Merge Conflict** - Syntax highlighting for conflict markers

### Command Line Tools

```bash
# Install conflict resolution helper
npm install -g diff-so-fancy

# Better diff output
git diff | diff-so-fancy
```

## Best Practices

### 1. Always Test After Resolution

```bash
# Run the complete test suite
pnpm validate

# Specifically test the affected modules
pnpm test -- --testPathPattern=affected-tests
```

### 2. Communicate with Team

```bash
# Tag relevant team members in PR
# Explain the conflict resolution approach
# Request specific review for risky changes
```

### 3. Use Visual Tools

-   VS Code merge conflict resolver
-   GitKraken, SourceTree, or similar tools
-   GitHub's web-based conflict resolution for simple cases

### 4. Document Complex Resolutions

```bash
# Add detailed commit message for complex merges
git commit -m "resolve: complex merge conflicts

- Resolved authentication flow conflicts
- Updated database schema changes
- Maintained backward compatibility
- All tests passing"
```

### 5. Prevention Checklist

-   [ ] Pull from develop regularly
-   [ ] Keep PRs small and focused
-   [ ] Communicate with team members
-   [ ] Use meaningful commit messages
-   [ ] Test thoroughly after each resolution
-   [ ] Run full validation suite

### Emergency Contacts

-   **Team Lead**: [contact info]
-   **Senior Developer**: [contact info]
-   **DevOps Team**: [contact info]

### When to Ask for Help

-   Multiple failed resolution attempts
-   Complex business logic conflicts
-   Database schema conflicts
-   Security-sensitive code changes -跨团队协同时的冲突

Remember: When in doubt, ask for help rather than potentially breaking production code!
