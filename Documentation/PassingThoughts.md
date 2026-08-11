# Passing Thoughts

Borrowing from Rethought V1, I'll capture some passing thoughts so that I hopefully don't forget them later

- Since I'm wanting to create a concept of Lifecycles, making a new git repo is one of them. Ensure that I configure my .git/config file with aliases, and directly stipulate the username and email so that it doesn't use a random account to log commits against

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
