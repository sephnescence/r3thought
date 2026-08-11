# Full dump from Claude

Here's the full set, in the order I'd run them. Set these once at the top so everything below is copy-pasteable:

```bash
OWNER=your-username
REPO=your-repo
```

## 1. Repo-level settings (merge behaviour, cleanup)

```bash
gh api -X PATCH "repos/$OWNER/$REPO" \
  -F allow_merge_commit=false \
  -F allow_rebase_merge=false \
  -F allow_squash_merge=true \
  -F squash_merge_commit_title=PR_TITLE \
  -F squash_merge_commit_message=PR_BODY \
  -F delete_branch_on_merge=true \
  -F allow_auto_merge=true \
  -F has_wiki=false \
  -F has_projects=false
```

## 2. Default branch (if it isn't already `main`)

```bash
gh api -X PATCH "repos/$OWNER/$REPO" -f default_branch=main
```

## 3. Security features

```bash
# Dependabot vulnerability alerts
gh api -X PUT "repos/$OWNER/$REPO/vulnerability-alerts"

# Dependabot automated security fix PRs
gh api -X PUT "repos/$OWNER/$REPO/automated-security-fixes"

# Secret scanning + push protection (public repos, or private with GitHub Advanced Security)
gh api -X PATCH "repos/$OWNER/$REPO" \
  -f 'security_and_analysis[secret_scanning][status]=enabled' \
  -f 'security_and_analysis[secret_scanning_push_protection][status]=enabled'
```

## 4. Default workflow permissions (read-only token unless a workflow opts in)

```bash
gh api -X PUT "repos/$OWNER/$REPO/actions/permissions/workflow" \
  -f default_workflow_permissions=read \
  -F can_approve_pull_request_reviews=false
```

## 5. Branch ruleset for `main`

This is the big one — rulesets take a JSON body, so it's cleanest to keep the JSON as a file in the repo (which also gives you your canonical, versioned config):

```bash
gh api -X POST "repos/$OWNER/$REPO/rulesets" --input main-ruleset.json
```

`main-ruleset.json`:

```json
{
  "name": "protect-main",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH"],
      "exclude": []
    }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": true
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [{ "context": "test" }]
      }
    }
  ]
}
```

Notes on that JSON:

- `~DEFAULT_BRANCH` is a built-in target, so the ruleset follows the default branch even if you rename it. Use `refs/heads/main` if you'd rather be explicit.
- `deletion` blocks deleting the branch, `non_fast_forward` blocks force pushes.
- `strict_required_status_checks_policy: true` = "require branches to be up to date before merging".
- `context: "test"` must match your Actions **job name** (or its `name:` if you set one). Remember the check has to have run once before GitHub recognises it, but with the API you can declare it up front regardless — it just won't be satisfiable until the workflow exists.
- Solo repo: drop `required_approving_review_count` to `0` to keep the PR gate without deadlocking yourself.
- Optional additions to `rules`: `{ "type": "required_linear_history" }`, `{ "type": "required_signatures" }`.

## 6. Tag protection ruleset (if you cut releases from tags)

```bash
gh api -X POST "repos/$OWNER/$REPO/rulesets" --input tag-ruleset.json
```

```json
{
  "name": "protect-release-tags",
  "target": "tag",
  "enforcement": "active",
  "conditions": {
    "ref_name": { "include": ["refs/tags/v*"], "exclude": [] }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "update" }
  ]
}
```

## Verify it all took

```bash
gh api "repos/$OWNER/$REPO" --jq '{default_branch, allow_squash_merge, allow_merge_commit, delete_branch_on_merge, allow_auto_merge}'
gh api "repos/$OWNER/$REPO/rulesets" --jq '.[] | {id, name, enforcement}'
gh api "repos/$OWNER/$REPO/rulesets/RULESET_ID"   # full detail of one
```

One gotcha: `-f` sends values as strings and `-F` coerces types (booleans/integers), which is why the boolean flags above use `-F`. If a call fails with a validation error, that's the first thing to check.

Since it's all API-driven, you can wrap the whole lot in a `setup-repo.sh` taking `$OWNER/$REPO` as an argument — run it on every new repo and your SDLC config is one command. Want me to bundle it into that script?
