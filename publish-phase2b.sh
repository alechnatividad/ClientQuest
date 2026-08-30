#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# ClientQuest · Phase 2B one-shot publisher
#
# Run from the repository root (the checkout that contains the Phase 2B
# working tree). It will:
#   1. verify the Phase 2B file set is present and protected files untouched
#   2. cut a BRAND NEW branch from latest origin/main
#   3. stage EXACTLY the 11 Phase 2B files (nothing else)
#   4. run typecheck + production build
#   5. commit, push, and open a NEW PR against main
#
# Usage:   bash publish-phase2b.sh
# Requires: git, gh (authenticated), node/npm
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BRANCH="feature/phase2b-crud-clean"

# ── 0. sanity ────────────────────────────────────────────────────────────────
command -v git >/dev/null || { echo "git is required"; exit 1; }
command -v gh  >/dev/null || { echo "gh (GitHub CLI) is required"; exit 1; }
[ -f package.json ] && [ -f src/lib/repo.ts ] || {
  echo "Run this from the repository root (package.json not found)."; exit 1; }
git rev-parse --is-inside-work-tree >/dev/null || { echo "Not a git repo."; exit 1; }

PHASE2B_FILES=(
  src/lib/workspace.tsx
  src/lib/repo.ts
  src/components/app/ui.tsx
  src/components/app/ProjectForm.tsx
  src/pages/clients/ClientsPage.tsx
  src/pages/owner/ProjectsPage.tsx
  src/pages/owner/ProjectWorkspacePage.tsx
  src/pages/owner/DashboardPage.tsx
  src/App.tsx
  src/index.css
  index.html
)

echo "▸ verifying Phase 2B file set…"
for f in "${PHASE2B_FILES[@]}"; do
  [ -f "$f" ] || { echo "MISSING: $f — workspace tree incomplete, aborting."; exit 1; }
done

# protected content spot-checks (must all be present)
grep -q "get diagnostics v_rows = row_count" supabase/tests/phase2a_rls_test_plan.sql \
  || { echo "Phase 2A test fix missing — aborting to protect supabase/."; exit 1; }
grep -q "MANUALLY DERIVED" src/types/database.ts \
  || { echo "src/types/database.ts looks wrong — aborting."; exit 1; }

# ── 1. fresh branch off latest main ─────────────────────────────────────────
echo "▸ fetching origin…"
git fetch origin

if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "Branch $BRANCH already exists locally."
  echo "  Delete it first (git branch -D $BRANCH) or pick another name — refusing to reuse it."
  exit 1
fi
git switch -c "$BRANCH" origin/main

# ── 2. stage exactly the Phase 2B files ─────────────────────────────────────
echo "▸ staging ${#PHASE2B_FILES[@]} files…"
git add -- "${PHASE2B_FILES[@]}"

STAGED="$(git diff --cached --name-only)"
if echo "$STAGED" | grep -qE '^(supabase/|src/types/database\.ts)'; then
  echo "A protected path slipped into the index — aborting:"
  echo "$STAGED" | grep -E '^(supabase/|src/types/database\.ts)'
  exit 1
fi
COUNT="$(echo "$STAGED" | grep -c .)"
echo "  $COUNT file(s) staged"

# ── 3. gates ─────────────────────────────────────────────────────────────────
echo "▸ npm run typecheck…"
npm run typecheck

echo "▸ npm run build…"
npm run build

# ── 4. commit · push · PR ────────────────────────────────────────────────────
git commit -m "feat(phase2b): workspace bootstrap + clients/projects CRUD

- centralized workspace bootstrap via workspace_members; owner membership is
  created by the existing database trigger, never by the client
- data layer (src/lib/repo.ts): typed, workspace-scoped clients/projects CRUD
  over the authenticated browser client only — no service key, no RLS bypass
- clients: list, search, active/archived filter, create, edit, archive, delete
- projects: list, search, status filter, inline status change, client
  assignment from the active workspace, due dates, create, delete
- project detail route with honest not-found handling
- dashboard shows live counts and recent projects
- additive design tokens + route map required by the above
- no changes under supabase/ and no changes to src/types/database.ts"

echo "▸ pushing…"
git push -u origin "$BRANCH"

echo "▸ opening PR against main…"
gh pr create --base main \
  --title "Phase 2B — workspace bootstrap + clients/projects CRUD" \
  --body "Clean Phase 2B application changes, branched fresh from latest main.

**Included:** centralized workspace bootstrap, typed Supabase data layer, Clients CRUD (search/filter/archive/delete), Projects CRUD (client assignment, status, due dates), real project detail page, live dashboard data, shared Phase 2B UI kit.

**Untouched:** supabase/migrations/, supabase/tests/, src/types/database.ts, RLS/triggers/functions, auth architecture, client portal /p/:token, billing.

**Validation:** npm run typecheck ✅ · npm run build ✅ · staged diff contains exactly the ${#PHASE2B_FILES[@]} Phase 2B files."

echo ""
echo "✔ done — PR opened from $BRANCH"
echo "  commit: $(git rev-parse HEAD)"
gh pr view --json url,number --jq '"  PR #" + (.number|tostring) + ": " + .url'
