<!-- cspell:ignore longpaths oneline automerge coderabbit -->

# About this fork

This is a fork of [laurent22/joplin](https://github.com/laurent22/joplin). We add our own improvements on top of upstream Joplin and keep pulling in upstream releases and fixes.

## Branches

| Branch | Purpose | Rules |
| --- | --- | --- |
| `dev` | Exact mirror of `upstream/dev`, updated automatically. | Never commit to it. Never resolve conflicts on it. |
| `main` | Integration branch: upstream plus our changes. Default branch. | Changes arrive only through PRs. |
| `feat/*`, `fix/*` | Our work. | Branch from `main`, open the PR against `main`. |

Keep our changes small and self-contained, so upstream merges stay easy. Put new code in new files where possible, rather than spreading edits through upstream files. If a change would be useful to everyone, consider sending it upstream too: every change upstream accepts is one less thing to maintain here.

## Local setup

```bash
git clone https://github.com/ameralqarallih-lgtm/joplin.git
cd joplin
git config core.longpaths true
git remote add upstream https://github.com/laurent22/joplin.git
git remote set-url --push upstream DISABLED
git fetch upstream --tags
git switch main
```

For building and running the apps, see [readme/dev/BUILD.md](readme/dev/BUILD.md) and [readme/dev/index.md](readme/dev/index.md).

## Upstream tracking (automated)

[.github/workflows/fork-upstream-sync.yml](.github/workflows/fork-upstream-sync.yml) runs daily at 04:17 UTC. You can also start it by hand from the Actions tab, with a dry-run option. It runs [.github/fork/upstream-sync.sh](.github/fork/upstream-sync.sh), which:

1. **Mirrors `dev`.** It fast-forwards `dev` to `upstream/dev`. If someone has committed to `dev`, it stops with an error instead of merging or overwriting.
2. **Opens a sync PR.** When `main` is behind `dev`, it opens a `dev → main` PR labelled `upstream-sync`. The PR updates itself as `dev` advances.
3. **Tracks releases.** It opens an issue labelled `upstream-release` for each new upstream GitHub release (desktop, `v*`) and for the newest `android-v*` and `server-v*` tags. Each issue links the release notes or changelog, says how many of the release's commits are missing from `main`, and has a review checklist.

The script can also run locally: `DRY_RUN=1 bash .github/fork/upstream-sync.sh`. It needs `gh` to be signed in.

### Required secret: `FORK_SYNC_TOKEN`

Upstream changes `.github/workflows/` often. The default `GITHUB_TOKEN` is not allowed to push those commits, and it cannot open PRs unless that is enabled in settings. So the workflow uses a fine-grained personal access token:

1. Go to GitHub → Settings → Developer settings → Fine-grained tokens → **Generate new token**.
2. Under repository access, choose **Only select repositories** → this fork.
3. Under repository permissions, set **Contents**, **Pull requests**, **Issues** and **Workflows** to *Read and write*.
4. Save the token as a repository secret named `FORK_SYNC_TOKEN`: Settings → Secrets and variables → Actions.

Without the secret, the workflow falls back to `GITHUB_TOKEN`. Syncing then fails whenever upstream has touched a workflow file.

## Continuous integration

Upstream's CI only runs in `laurent22/joplin`, so the fork has its own, in [.github/workflows/fork-ci.yml](.github/workflows/fork-ci.yml). It runs on every PR into `main` and on every push to `main`:

1. `yarn install`. This builds every package and runs `yarn tsc`, so it also type-checks the code.
2. ESLint on the files the PR changes.
3. Tests for `utils`, `renderer`, `editor`, `lib`, `app-desktop` and `app-mobile`.

Merge a PR only when this check passes.

## Merging a sync PR

- Always merge with **Create a merge commit**. Squash or rebase would rewrite upstream's history, and every later sync would conflict again.
- Watch out for upstream changes that touch the same code as ours. Re-test our features after each sync.

### Resolving a conflicted sync

Don't use GitHub's **Resolve conflicts** button on the sync PR. It commits into `dev`, which breaks the mirror. Resolve locally instead:

```bash
git fetch origin
git switch -c sync/$(date +%Y-%m-%d) origin/main
git merge origin/dev           # fix conflicts, then: git add ... && git commit
git push -u origin HEAD
gh pr create --base main --title "Sync upstream dev into main"
```

Merge that PR with a merge commit. The automatic `dev → main` PR closes itself once `main` contains `dev`.

### If `dev` was committed to by mistake

```bash
git switch -c rescue/dev-commits origin/dev   # keep the stray commits
git push -u origin HEAD
git fetch upstream
git push --force origin upstream/dev:dev      # restore the mirror
```

Then cherry-pick the rescued commits into a feature branch off `main`.

## Release-only fixes

Upstream sometimes publishes a release from a release branch, with fixes that reach `dev` later. A release issue that reports missing commits after the latest sync has been merged points to this. Cherry-pick what we need:

```bash
git fetch upstream --tags
git log --oneline origin/main..v3.7.22      # commits in the release that main lacks
git switch -c fix/upstream-v3.7.22 origin/main
git cherry-pick -x <sha>...
```

## Upstream workflows in this fork

Upstream's build, test and release workflows check `github.repository == 'laurent22/joplin'`, so they skip here. Upstream's maintenance workflows don't make sense in a fork and are disabled in the Actions settings: `automerge`, `check-pr-title`, `comment-on-failure` and `delete-coderabbit-comments`. Disabling a workflow in the settings survives syncs, because the workflow files stay unchanged.

## Licensing and naming

- Code is AGPL-3.0-or-later, except directories with their own licence. `packages/server` is under the [Joplin Server Personal Use License](packages/server/LICENSE.md). If we distribute modified apps, or run a modified service for other people, we must share the source.
- "Joplin" is a registered trademark of JOPLIN SAS. Builds we hand out to others should use our own app name and application ID.
