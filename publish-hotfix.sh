#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# ClientQuest — publish the Phase 2B workspace-bootstrap hotfix to GitHub.
#
# This sandbox cannot push, so this script IS the publish step. Run it from a
# checkout of alechnatividad/ClientQuest that holds this working tree:
#
#     bash publish-hotfix.sh
#
# It creates fix/workspace-bootstrap-first-login fresh from latest main,
# stages ONLY the hotfix file, gates on typecheck + build, pushes, opens a NEW
# PR against main, and prints the PR link, number and commit SHA.
# It never touches PR #11 and never merges anything.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BRANCH="fix/workspace-bootstrap-first-login"
HOTFIX_FILE="src/lib/workspace.tsx"

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
dim()   { printf '\033[2m%s\033[0m\n' "$*"; }

fail() { red "✖ $*"; exit 1; }

command -v git >/dev/null 2>&1 || fail "git is required."
command -v gh  >/dev/null 2>&1 || fail "gh (GitHub CLI, authenticated) is required."
[ -d .git ] || fail "run this from the root of a ClientQuest git checkout."

dim "→ fetching origin/main"
git fetch origin main

# Fresh branch only — never reuse an existing one (it could carry PR #11 history).
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  fail "local branch '$BRANCH' already exists. Inspect it, then 'git branch -D $BRANCH' and re-run."
fi

dim "→ cutting $BRANCH from origin/main"
git switch -c "$BRANCH" origin/main

# The working tree must differ from main by EXACTLY the hotfix file.
CHANGED="$(git diff --name-only origin/main -- .)"
if [ "$CHANGED" != "$HOTFIX_FILE" ]; then
  red "✖ working tree differs from origin/main by more (or less) than the hotfix file:"
  printf '    %s\n' $CHANGED
  fail "expected exactly: $HOTFIX_FILE — resolve the drift, then re-run."
fi

# The protected paths must be byte-identical to main.
for f in \
  src/types/database.ts \
  supabase/tests/phase2a_rls_test_plan.sql \
  supabase/migrations/20260216120000_phase2a_core_schema.sql; do
  git diff --quiet origin/main -- "$f" || fail "$f differs from main — the hotfix must not touch it."
done
green "✔ diff surface verified: exactly one file ($HOTFIX_FILE)"

dim "→ staging the hotfix"
git add "$HOTFIX_FILE"

dim "→ gate: npm run typecheck"
npm run typecheck

dim "→ gate: npm run build"
npm run build
green "✔ typecheck + build passed"

git commit -m "fix(app): first-login workspace bootstrap

- membership probes use maybeSingle(): zero rows is the normal first-login
  state, never a PGRST116 application error
- insert uses maybeSingle() on the RETURNING row — a SELECT-policy-filtered
  row recovers via membership verification instead of failing the bootstrap
- membership is re-checked immediately before insert; a post-insert
  verification catches concurrent-tab creations (no duplicate workspaces)
- one shared in-flight bootstrap promise per user: StrictMode double
  effects, Try-again spam and refreshes attach to the same run
- real Supabase code/message/details/hint preserved in console; UI shows
  only curated text plus the opaque PostgREST code

Database untouched: schema, RLS, triggers and generated types unchanged."

git push -u origin "$BRANCH"

PR_URL="$(gh pr create \
  --base main \
  --title "fix(app): first-login workspace bootstrap (maybeSingle + dedupe + error logs)" \
  --body "## Root cause
Client-side, in \`src/lib/workspace.tsx\` — the database is sound (the SECURITY
DEFINER trigger \`handle_workspace_created\` creates the owner membership; the
Phase 2A harness proves insert-as-\`authenticated\` works). The bootstrap
hard-failed on first login because an empty membership probe surfaced as an
error (PGRST116-style, the classic \`.single()\`-on-zero-rows failure) instead
of being treated as the normal create-workspace path, and the insert's
\`.select(\"*\").single()\` RETURNING could itself throw when the SELECT policy
filtered the row.

## Fix (1 file: \`src/lib/workspace.tsx\`)
- \`maybeSingle()\` on both membership probes — zero rows = normal first login
- \`maybeSingle()\` on the insert's RETURNING row + post-insert verification
- membership re-check immediately before insert
- one shared in-flight bootstrap promise per user (StrictMode / retry / refresh safe)
- real Supabase code/message/details/hint in console; curated text + opaque code in UI

## Untouched
schema · migrations · RLS · triggers/functions · \`src/types/database.ts\` ·
auth architecture · client portal · billing

## Validation
- \`npm run typecheck\` ✔
- \`npm run build\` ✔
- diff vs main = exactly \`src/lib/workspace.tsx\`

Does not update or merge PR #11. Not merged." )"

SHA="$(git rev-parse HEAD)"
echo
green "──────────────────────────────────────────────"
green "  PUBLISHED — hotfix PR opened against main"
green "──────────────────────────────────────────────"
echo "  branch : $BRANCH"
echo "  commit : $SHA"
echo "  PR     : $PR_URL"
green "──────────────────────────────────────────────"
dim "Nothing was merged. PR #11 was not touched."
