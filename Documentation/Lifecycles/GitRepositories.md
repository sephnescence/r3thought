# Git Repository Lifecycles (GitHub)

## Checking GitHub Authentication

Verify the results of `gh auth status`:

- If the repository's owner is not listed at all, run `gh auth login --hostname GitHub.com --web` and try again
- If the repository's owner is listed as the `Active account: false`, run `gh auth switch --user Sephnescence` and try again
- If the repository's owner is listed as the `Active account: true`, then everything is good

`gh` commands will return `404 Not Found` for private repos if the Active account doesn't match the repository's owner

## Creating a new git repo

Assuming of course that the git provider is GitHub, then the bare minimum/good/better/best approach would be as follows

### Bare Minimum

Private Repository, .git/config set up accordingly

```bash
git config user.name "Sephnescence"
git config user.email "sephnescence@gmail.com"
git config alias.ci commit
git config alias.co checkout
git config alias.di diff
git config alias.pop 'reset HEAD~1'
git config alias.undo 'reset --soft HEAD~1'
git config alias.st status
git config alias.po '!git push -u origin $(git symbolic-ref --short HEAD)'
git config alias.pu '!git push -u upstream $(git symbolic-ref --short HEAD)'
git config alias.utdir 'rm -r --cached'
git config alias.ut 'rm --cached'
```

Some combination from [Git Repositories Appendix A](GitRepositories/GitRepositories-AppendixA.md)

- allow_merge_commit false
- allow_rebase_merge false
- allow_squash_merge true
- default_branch main

#### Bare Minimum Example

Note the `-f`/`-F` gotcha from [Git Repositories Appendix A](GitRepositories/GitRepositories-AppendixA.md): `-F` coerces types (booleans), `-f` sends plain strings

```bash
export OWNER=Sephnescence
export REPO=r3thought

gh api -X PATCH "repos/$OWNER/$REPO" \
  -F allow_merge_commit=false \
  -F allow_rebase_merge=false \
  -F allow_squash_merge=true \
  -f default_branch=main

gh api "repos/$OWNER/$REPO" \
  --jq '{default_branch, allow_squash_merge, allow_merge_commit, allow_rebase_merge}'
```

### Good

Enforcing passing CI tasks

Everything from Bare Minimum, plus a branch ruleset on `main` that requires a passing `test` check and a pull request. Once this is in place, `git po` from `main` will be rejected - the only way to change `main` is branch, PR, green CI, squash merge

Two parts are needed

1. A CI workflow, so the `test` check actually exists
2. A ruleset on `main` requiring that check

#### Good Example

First, the workflow. Per [Git Repositories Appendix A](GitRepositories/GitRepositories-AppendixA.md), the ruleset's `context` must match the Actions **job name** (`test` below, since the job sets no `name:`). The check has to have run at least once before GitHub recognises it, but the ruleset can be declared up front regardless

Note: Rulesets require a paid GitHub Pro plan, or for the repo to be listed as public with `gh repo edit Sephnescence/r3thought --visibility public`

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

Then the ruleset. Notes on the JSON, from [Git Repositories Appendix A](GitRepositories/GitRepositories-AppendixA.md):

- `~DEFAULT_BRANCH` follows the default branch even if it's renamed
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

#### Proving it worked

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

### Better

Everything from [Git Repositories Appendix A](GitRepositories/GitRepositories-AppendixA.md)

### Best

Borrowing from [Git Repositories Appendix A](GitRepositories/GitRepositories-AppendixA.md), actually reading through the documentation

Fleshed out example to come, pending deciding on task names that I like
