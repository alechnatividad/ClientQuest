#!/usr/bin/env bash
# fix-vercel-author.sh — fix git author identity for Vercel Hobby deploys
#
# Usage:
#   bash fix-vercel-author.sh                 # set identity + empty commit + push
#   bash fix-vercel-author.sh --rewrite 10    # also rewrite the last 10 commits' authors
#   GIT_AUTHOR_NAME="Ale C. Natividad" bash fix-vercel-author.sh   # if user.name isn't set yet
set -euo pipefail

EMAIL="alechnatividad@gmail.com"
NAME="$(git config user.name 2>/dev/null || true)"

# 1) Set repo-local git identity
git config user.email "$EMAIL"

if [ -z "$NAME" ]; then
  NAME="${GIT_AUTHOR_NAME:-}"
  if [ -z "$NAME" ]; then
    echo "No git user.name is set. Re-run with your name, e.g.:"
    echo "  GIT_AUTHOR_NAME=\"Ale C. Natividad\" bash $0"
    exit 1
  fi
  git config user.name "$NAME"
fi

echo "Git author is now: $(git config user.name) <$(git config user.email)>"

BRANCH="$(git branch --show-current)"

# 2) Optional: rewrite recent commits that carry the wrong author email.
#    Vercel scans every commit on the branch, so this is the fix that
#    actually clears the "team collaboration" error.
if [ "${1:-}" = "--rewrite" ]; then
  COUNT="${2:-10}"
  echo "Rewriting authors on the last $COUNT commits..."
  git rebase "HEAD~$COUNT" --exec "git commit --amend --reset-author --no-edit"
  git push --force-with-lease origin "$BRANCH"
  echo "Force-pushed rewritten history to origin/$BRANCH."
  echo "Done — Vercel should redeploy cleanly under $EMAIL."
  exit 0
fi

# 3) Default: empty commit under the corrected identity + normal push
git commit --allow-empty -m "Fix commit author for Vercel"
git push origin "$BRANCH"
echo "Done — pushed an empty commit authored as $EMAIL to origin/$BRANCH."
echo "If Vercel still flags old commits, re-run: bash $0 --rewrite 10"
