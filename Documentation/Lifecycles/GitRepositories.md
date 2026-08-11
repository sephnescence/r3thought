# Git Repository Lifecycles (GitHub)

## Checking GitHub Authentication

Verify the results of `gh auth status`:

- If the repository's owner is not listed at all, run `gh auth login --hostname GitHub.com --web` and try again
- If the repository's owner is listed as the `Active account: false`, run `gh auth switch --user Sephnescence` and try again
- If the repository's owner is listed as the `Active account: true`, then everything is good

`gh` commands will return `404 Not Found` for private repos if the Active account doesn't match the repository's owner

## Creating a new git repo

Assuming of course that the git provider is GitHub, then the bare-minimum/good/better/best approach would be as follows

### Bare-minimum

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

#### Example

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

### Better

Everything from [Git Repositories Appendix A](GitRepositories/GitRepositories-AppendixA.md)

### Best

Borrowing from [Git Repositories Appendix A](GitRepositories/GitRepositories-AppendixA.md), actually reading through the documentation

Fleshed out example to come, pending deciding on task names that I like
