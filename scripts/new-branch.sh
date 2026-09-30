#!/usr/bin/env bash
# Creates a correctly named branch from the correct base.
# Usage: scripts/new-branch.sh <type> <name>
#   scripts/new-branch.sh feature match-history
#   scripts/new-branch.sh hotfix broken-apply-form
#   scripts/new-branch.sh release 1.2.0
set -euo pipefail

TYPES="feature fix hotfix release refactor perf test docs chore ci experiment"
usage() { echo "Usage: $0 <type> <name>   (types: $TYPES)"; exit 1; }
[[ $# -eq 2 ]] || usage
type="$1"; name="$2"

case "$type" in
  feature|fix|refactor|perf|test|docs|chore|ci|experiment) base="develop" ;;
  hotfix) base="main" ;;
  release) base="staging" ;;
  *) echo "Unknown type '$type'."; usage ;;
esac

if [[ "$type" == "release" ]]; then
  [[ "$name" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "release name must be major.minor.patch"; exit 1; }
else
  [[ "$name" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] || { echo "name must be lowercase-kebab-case"; exit 1; }
fi

branch="$type/$name"
git fetch origin --prune
git show-ref --verify --quiet "refs/remotes/origin/$base" || { echo "origin/$base does not exist"; exit 1; }
git show-ref --verify --quiet "refs/heads/$branch" && { echo "$branch already exists locally"; exit 1; }
git checkout -b "$branch" "origin/$base"
echo "Created $branch from origin/$base. Open the PR against: $([[ $type == release || $type == hotfix ]] && echo main || echo develop)"
