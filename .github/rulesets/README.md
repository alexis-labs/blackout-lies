# GitHub Rulesets

These JSON files are importable GitHub repository rulesets.

Import them from the repository on GitHub:

1. Open **Settings**.
2. Open **Rules** > **Rulesets**.
3. Choose **New ruleset** > **Import a ruleset**.
4. Import each JSON file in this directory.

## Files

- `default-branch.json` protects the default branch by requiring pull requests, one approval, resolved review threads, no branch deletion, no force pushes, and passing `lint`, `typecheck`, and `build` checks.
- `release-tags.json` protects version tags matching `v*` from deletion and force updates.
