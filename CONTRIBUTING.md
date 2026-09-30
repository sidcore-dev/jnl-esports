# Branching and workflow

The repository uses three long-lived branches and short-lived typed branches. Rules are enforced by the `branch-policy` check and branch protection, not by convention alone.

## Long-lived branches

| Branch    | Purpose                         | Deployed to                    | Direct pushes |
|-----------|---------------------------------|--------------------------------|---------------|
| `main`    | Production. Every commit is releasable and tagged. | cPanel `public_html` (Deploy HEAD Commit) | Blocked |
| `staging` | Pre-production verification.    | Preview / manual QA            | Blocked |
| `develop` | Integration of finished work.   | Nothing                        | Blocked |

Promotion flow: `topic branch -> develop -> staging -> main`, always by pull request.

## Branch types

Names are `<type>/<name>`, lowercase kebab-case. Create them with `scripts/new-branch.sh <type> <name>`, which picks the right base.

| Type         | Use for                              | Branch from | Merge into | Example                    |
|--------------|--------------------------------------|-------------|------------|----------------------------|
| `feature/`   | New functionality or pages           | `develop`   | `develop`  | `feature/match-history`    |
| `fix/`       | Non-urgent bug fixes                 | `develop`   | `develop`  | `fix/roster-table-mobile`  |
| `refactor/`  | Code changes with no behavior change | `develop`   | `develop`  | `refactor/split-css`       |
| `perf/`      | Performance improvements             | `develop`   | `develop`  | `perf/lazy-load-logo`      |
| `test/`      | Tests only                           | `develop`   | `develop`  | `test/apply-validation`    |
| `docs/`      | Documentation only                   | `develop`   | `develop`  | `docs/deploy-guide`        |
| `chore/`     | Tooling, dependencies, content data  | `develop`   | `develop`  | `chore/update-roster`      |
| `ci/`        | CI and repo automation               | `develop`   | `develop`  | `ci/add-lint`              |
| `release/`   | Version stabilization, `x.y.z`       | `staging`   | `main`     | `release/1.2.0`            |
| `hotfix/`    | Urgent production fixes              | `main`      | `main`     | `hotfix/apply-form-down`   |
| `experiment/`| Throwaway spikes, never merged       | `develop`   | never      | `experiment/3d-hero`       |

After a `hotfix/` or `release/` merges into `main`, merge `main` back into `develop` so nothing is lost.

## Commits and pull requests

- Conventional commits: `<type>: <description>` with types `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `ci`.
- The pull request title uses the same format (it becomes the squash commit message). The check rejects other titles.
- Squash merge topic branches. Promotion PRs (`develop -> staging -> main`) use a merge commit.
- Keep branches short-lived. Delete them after merge.

## Releases

Tag every production release on `main` with a matching semantic version, for example `git tag v1.2.0 && git push origin v1.2.0`. Patch for fixes, minor for new features, major for breaking changes.

## Deploying to cPanel

After `main` changes, open Git Version Control, choose Manage on `jnl-esports`, then Update from Remote, then Deploy HEAD Commit. Only `main` is deployed.

## Local build

Pages are generated from `src/`. Run `node build.mjs` and commit the regenerated HTML with your change.
