# Git Repositories - Bare Minimum (GitHub)

Next tier: [Good](0002-GitRepositories-Good.md)

## What this tier gets you

Starting from nothing: a private repository with sane local config, and merge behaviour locked to squash-only. Nothing stops a direct push to `main` yet - that's the [Good](0002-GitRepositories-Good.md) tier's job

## Checking GitHub Authentication

Verify the results of `gh auth status`:

- If the repository's owner is not listed at all, run `gh auth login --hostname GitHub.com --web` and try again
- If the repository's owner is listed as the `Active account: false`, run `gh auth switch --user Sephnescence` and try again
- If the repository's owner is listed as the `Active account: true`, then everything is good

`gh` commands will return `404 Not Found` for private repos if the Active account doesn't match the repository's owner

## Local git config

Private Repository, .git/config set up accordingly

Never put a real email address in `user.email` (or in this guide - it gets committed too). Commit author emails are recorded in every commit and visible to anyone who can read the repo - and to everyone, if it ever goes public. GitHub provides a noreply address for exactly this, in the form `ID+USERNAME@users.noreply.github.com`. Look yours up with

```bash
gh api user --jq '"\(.id)+\(.login)@users.noreply.github.com"'
```

Then configure the repo, deriving the email rather than typing it

```bash
git config user.name "Sephnescence"
git config user.email "$(gh api user --jq '"\(.id)+\(.login)@users.noreply.github.com"')"
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

### Verifying what a commit will record

Check this before the first commit in any new repo - it's much easier than fixing history after the fact

```bash
git config user.name
git config user.email
git var GIT_AUTHOR_IDENT   # exactly what the next commit will stamp as author
git config --show-origin --get-all user.email   # which config file each value comes from
```

`--show-origin` matters because `user.email` can come from `~/.gitconfig` (global) as well as `.git/config` (local) - a repo with no local value silently falls back to the global one, which is usually where a real address sneaks in

### Verifying nothing has leaked into history already

```bash
git log --format='%an <%ae> | %cn <%ce>' | sort -u
```

Every line should show noreply-style addresses. If a real address shows up

- Fixing `user.email` only affects *future* commits - the old ones keep whatever they recorded. If the offending commits are only on an unpushed branch, `git commit --amend --reset-author` (or a rebase with `--reset-author`) fixes them; if they're already on `main`, rewriting is a bigger exercise and usually not worth it for a private repo
- In GitHub's Settings -> Emails, enable **Keep my email addresses private** and **Block command line pushes that expose my email** - with the latter on, GitHub rejects any push containing commits authored with your real address (a `GH007` error), so a misconfigured clone gets caught at push time instead of leaking

### How commit attribution actually works

Two things worth knowing so the noreply address makes sense:

- The noreply address doesn't hide *who you are* on GitHub - it literally contains your username, which is public knowledge anyway (profile URL, commit avatars, PR authorship). What it protects is your real inbox address - the thing that links your GitHub identity to your Google account, password-leak dumps, and every other service you signed up to with it. Username public, mailbox private is the intended trade
- GitHub doesn't bake attribution into the commit - it resolves *author email -> account* at display time, every time. A commit shows as whichever account has that email verified, so authoring with an email that's verified on the wrong account (e.g. a work account) attributes your commits to that account. And because resolution is dynamic, changing which account an email is verified on retroactively changes how *existing* commits display - no history rewrite needed. The email string itself stays in the old commits' raw metadata either way; only a rewrite removes that

To check which account GitHub attributes a commit to:

```bash
gh api "repos/$OWNER/$REPO/commits/COMMIT_SHA" \
  --jq '{author_email: .commit.author.email, attributed_to: .author.login}'
```

If `attributed_to` isn't the account you expect (or is `null`, meaning the email isn't verified on any account), fix it in GitHub's Settings -> Emails - either remove the email from the wrong account, or add and verify it on the right one. It can only be verified on one account at a time

## Repo settings

Squash-only merges, `main` as the default branch

- allow_merge_commit false
- allow_rebase_merge false
- allow_squash_merge true
- default_branch main

### The `-f`/`-F` gotcha

`-f` sends values as plain strings, while `-F` coerces types (booleans/integers) - which is why the boolean flags below use `-F` and the branch name uses `-f`. If a call fails with a validation error, that's the first thing to check

### Example

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
