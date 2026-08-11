# Git Repository Lifecycles (Github)

## Creating a new git repo

Assuming of course that the git provider is Github, then the bare-minimum/good/better/best approach would be as follows

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

### Good

Enforcing passing CI tasks

### Better

Everything from [Git Repositories Appendix A](GitRepositories/GitRepositories-AppendixA.md)

### Best

Borrowing from [Git Repositories Appendix A](GitRepositories/GitRepositories-AppendixA.md), actually reading through the documentation

Fleshed out example to come, pending deciding on task names that I like
