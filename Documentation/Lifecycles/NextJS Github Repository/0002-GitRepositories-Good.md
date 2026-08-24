# Git Repositories - Good (GitHub)

Previous tier: [Bare Minimum](0001-GitRepositories-Bare-Minimum.md) | Next tier: [Better](../Notes/GitRepositories-Better.md) (notes)

## The level up from Bare Minimum

Bare Minimum left `main` wide open - `git po` from `main` just works. Good enforces passing CI tasks: a branch ruleset on `main` that requires a passing `test` check and a pull request. Once this is in place, `git po` from `main` will be rejected - the only way to change `main` is branch, PR, green CI, squash merge

Two parts are needed

1. A CI workflow, so the `test` check actually exists
2. A ruleset on `main` requiring that check

## Part 1 - The CI workflow

The ruleset's `context` must match the Actions **job name** (`test` below, since the job sets no `name:`), or its `name:` if you set one. The check has to have run at least once before GitHub recognises it, but the ruleset can be declared up front regardless - it just won't be satisfiable until the workflow exists

Note: Rulesets require a paid GitHub Pro plan, or for the repo to be listed as public with `gh repo edit Sephnescence/r3thought --visibility public`. You should be prompted to run it again with `--accept-visibility-change-consequences`

`code .github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Replace with real tests"
```

## Part 2 - The ruleset

Notes on the JSON:

- `~DEFAULT_BRANCH` is a built-in target, so the ruleset follows the default branch even if it's renamed. Use `refs/heads/main` if you'd rather be explicit
- `strict_required_status_checks_policy: true` = "require branches to be up to date before merging"
- `required_approving_review_count` is `0` because this is a solo repo - it keeps the PR gate without deadlocking yourself. Bump it to `1` the moment anyone else joins
- No `bypass_actors` are set, so the rules apply to admins too - that's what makes `git po` fail even for the repo owner

```bash
export OWNER=Sephnescence
export REPO=r3thought

gh api -X POST "repos/$OWNER/$REPO/rulesets" --input - <<'JSON'
{
  "name": "enforce-ci",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
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
JSON

gh api "repos/$OWNER/$REPO/rulesets" --jq '.[] | {id, name, enforcement}'
```

To inspect a single ruleset in full detail later:

```bash
gh api "repos/$OWNER/$REPO/rulesets/RULESET_ID"
```

## Proving it worked

From `main`, `git po` should now be rejected:

```bash
git co main
git po
```

Expected output (the key line is the `GH013`/rules violation - GitHub refuses the push because changes to `main` must come through a pull request with a passing `test` check):

```text
remote: error: GH013: Repository rule violations found for refs/heads/main.
remote:
remote: - Changes must be made through a pull request.
remote:
remote: - Required status check "test" is expected.
To github.com:Sephnescence/r3thought.git
 ! [remote rejected] main -> main (push declined due to repository rule violations)
error: failed to push some refs to 'github.com:Sephnescence/r3thought.git'
```

The working flow from here on is

```bash
git co -b my-change
git ci -am "My change"
git po # pushes the branch
gh pr create --fill
# wait for the test check to go green, then
gh pr merge --squash --auto
```
