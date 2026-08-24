# Git Repositories - Better (GitHub) - NOTES, not yet executed

Previous tier: [Good](../NextJS%20Github%20Repository/0002-GitRepositories-Good.md) | Next tier: [Best](GitRepositories-Best.md) (notes)

This tier hasn't been run yet. Once it's executed, its contents graduate into a numbered lifecycle doc and this note gets deleted

## The level up from Good

Good protects the *contents* of `main` (PR + green CI). Better protects the refs themselves and the wider repo surface: branch/tag deletion and force pushes blocked, merged branches cleaned up automatically, squash commits titled from the PR, security scanning on, and workflow tokens read-only by default

Everything below uses the same environment variables:

```bash
export OWNER=Sephnescence
export REPO=r3thought
```

## Repo-level settings (merge behaviour, cleanup)

Beyond the Bare Minimum settings: squash commit title/body come from the PR, merged branches are deleted automatically, auto-merge is allowed (used by `gh pr merge --squash --auto` in the Good working flow), and unused surfaces (wiki, projects) are turned off

```bash
gh api -X PATCH "repos/$OWNER/$REPO" \
  -F squash_merge_commit_title=PR_TITLE \
  -F squash_merge_commit_message=PR_BODY \
  -F delete_branch_on_merge=true \
  -F allow_auto_merge=true \
  -F has_wiki=false \
  -F has_projects=false
```

## Security features

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

## Default workflow permissions (read-only token unless a workflow opts in)

```bash
gh api -X PUT "repos/$OWNER/$REPO/actions/permissions/workflow" \
  -f default_workflow_permissions=read \
  -F can_approve_pull_request_reviews=false
```

## Hardening the `main` ruleset

Additions to the Good tier's `enforce-ci` ruleset `rules` array:

- `{ "type": "deletion" }` blocks deleting the branch
- `{ "type": "non_fast_forward" }` blocks force pushes
- Optional extras: `{ "type": "required_linear_history" }`, `{ "type": "required_signatures" }`

Rulesets take a JSON body, so it's cleanest to keep the JSON as a file in the repo (which also gives you your canonical, versioned config):

```bash
gh api -X POST "repos/$OWNER/$REPO/rulesets" --input main-ruleset.json
```

## Tag protection ruleset (if you cut releases from tags)

```bash
gh api -X POST "repos/$OWNER/$REPO/rulesets" --input tag-ruleset.json
```

`tag-ruleset.json`:

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

Since it's all API-driven, the whole lot could be wrapped in a `setup-repo.sh` taking `$OWNER/$REPO` as an argument - run it on every new repo and the SDLC config is one command
