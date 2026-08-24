# Git Repositories - Good (GitHub)

Previous tier: [Bare Minimum](0001-GitRepositories-Bare-Minimum.md) | Next tier: [Better](../Notes/GitRepositories-Better.md) (notes)

## The level up from Bare Minimum

Bare Minimum left `main` wide open - `git po` from `main` just works. Good enforces passing CI tasks: a branch ruleset on `main` that requires passing `spellcheck`, `lint`, and `test` checks plus a pull request. Once this is in place, `git po` from `main` will be rejected - the only way to change `main` is branch, PR, green CI, squash merge

Two parts are needed

1. A CI workflow, so the checks actually exist
2. A ruleset on `main` requiring those checks

## Part 1 - The CI workflow

One job per concern, because each job surfaces as its own named status check - a red `spellcheck` tells you what broke without opening logs, and the jobs run in parallel. The ruleset's `context` values must match the Actions **job names** (`spellcheck`/`lint`/`test` below, since the jobs set no `name:`), or their `name:` if you set one. Each check has to have run at least once before GitHub recognises it, but the ruleset can be declared up front regardless - it just won't be satisfiable until the workflow exists

Note: Rulesets require a paid GitHub Pro plan, or for the repo to be listed as public with `gh repo edit Sephnescence/r3thought --visibility public`. You should be prompted to run it again with `--accept-visibility-change-consequences`

`code .github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  spellcheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - run: npx --yes cspell@9 --no-progress "**"

  lint:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: r3thought-app
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          package_json_file: r3thought-app/package.json
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
          cache-dependency-path: r3thought-app/pnpm-lock.yaml
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Replace with real tests"
```

Notes on the jobs:

- **spellcheck** - cspell automatically picks up `cspell.config.yaml` at the repo root, so the CLI, the pipeline, and the IDE's cSpell extension all share one config and one `words` list. Two config entries matter for CI
  - `useGitignore: true` makes cspell respect `.gitignore` (so `node_modules` is skipped) without needing a `--gitignore` flag on every invocation
  - `ignorePaths` excludes generated files you don't own the spelling of - `pnpm-lock.yaml` alone was ~200 findings, and the starter SVGs are full of attribute values that aren't words. Ignore generated files rather than growing the dictionary
  - The version is pinned (`cspell@9`) so a future major release can't change lint behaviour under you
- **lint** - runs the app's `pnpm lint` (ESLint). The app living in a subfolder (`r3thought-app/`) means three things need pointing at it: the job's `working-directory`, `pnpm/action-setup`'s `package_json_file` (that's where it reads the `packageManager` field to know which pnpm to install), and `setup-node`'s `cache-dependency-path` (the lockfile that keys the pnpm store cache)
- **test** - still a placeholder, replaced when there are real tests to run

Before committing, prove the checks pass locally - a required check that's red on day one just deadlocks the next PR:

```bash
npx --yes cspell@9 --no-progress "**"
cd r3thought-app && pnpm lint
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
        "required_status_checks": [
          { "context": "spellcheck" },
          { "context": "lint" },
          { "context": "test" }
        ]
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

### Updating an existing ruleset

If the ruleset already exists (e.g. it originally only required `test`), it's a `PUT` to the ruleset's id rather than a `POST` - the `rules` array is replaced wholesale, so send the complete rules, not just the changed one:

```bash
RULESET_ID=$(gh api "repos/$OWNER/$REPO/rulesets" --jq '.[] | select(.name == "enforce-ci") | .id')
gh api -X PUT "repos/$OWNER/$REPO/rulesets/$RULESET_ID" --input - <<'JSON'
... same JSON body as above ...
JSON
```

## Proving it worked

From `main`, `git po` should now be rejected:

```bash
git co main
git po
```

Expected output (the key line is the `GH013`/rules violation - GitHub refuses the push because changes to `main` must come through a pull request with passing checks):

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
# wait for the checks to go green, then
gh pr merge --squash --auto
```
