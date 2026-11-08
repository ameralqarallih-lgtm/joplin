#!/usr/bin/env bash
# Keeps this fork in step with upstream Joplin. See FORK.md.
#
# 1. Fast-forwards the fork's mirror branch (dev) to upstream dev.
# 2. Opens a PR merging the mirror branch into the integration branch (main) when main is behind.
# 3. Opens an issue for each new upstream release (GitHub releases + platform tags) so fixes get reviewed.
#
# Runs from .github/workflows/fork-upstream-sync.yml, or locally with an authenticated gh CLI.

set -euo pipefail

UPSTREAM_REPO="${UPSTREAM_REPO:-laurent22/joplin}"
SYNC_BRANCH="${SYNC_BRANCH:-dev}"
INTEGRATION_BRANCH="${INTEGRATION_BRANCH:-main}"
RELEASE_LOOKBACK_DAYS="${RELEASE_LOOKBACK_DAYS:-14}"
TRACKED_TAG_PREFIXES="${TRACKED_TAG_PREFIXES:-android-v server-v}"
FORK_REPO="${FORK_REPO:-${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner --jq .nameWithOwner)}}"
FORK_OWNER="${FORK_REPO%%/*}"
DRY_RUN="${DRY_RUN:-0}"

status=0
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

run() {
	if [ "$DRY_RUN" = "1" ]; then
		echo "[dry-run] $*"
	else
		"$@"
	fi
}

ensure_labels() {
	run gh label create upstream-release -R "$FORK_REPO" --color 0E8A16 --description 'New upstream Joplin release to review' --force >/dev/null
	run gh label create upstream-sync -R "$FORK_REPO" --color 1D76DB --description 'Merges upstream changes into the integration branch' --force >/dev/null
}

sync_mirror() {
	echo "== Syncing $FORK_REPO:$SYNC_BRANCH from $UPSTREAM_REPO:$SYNC_BRANCH"

	# The mirror branch must only ever contain upstream commits; refuse rather than merge or overwrite.
	local extra
	extra="$(gh api "repos/$UPSTREAM_REPO/compare/$SYNC_BRANCH...$FORK_OWNER:$SYNC_BRANCH" --jq .ahead_by)" || return 1
	if [ "$extra" != "0" ]; then
		echo "::error::$FORK_REPO:$SYNC_BRANCH has $extra commit(s) that are not upstream. Move them to a feature branch and reset $SYNC_BRANCH to upstream/$SYNC_BRANCH (see FORK.md)."
		return 1
	fi

	if [ "$DRY_RUN" = "1" ]; then
		echo "[dry-run] would fast-forward $SYNC_BRANCH"
		return 0
	fi

	if ! gh api -X POST "repos/$FORK_REPO/merge-upstream" -f branch="$SYNC_BRANCH" --jq '"merge_type=\(.merge_type) \(.message)"'; then
		echo "::error::merge-upstream failed. If upstream changed .github/workflows, the token needs the Workflows permission: add a FORK_SYNC_TOKEN secret (see FORK.md)."
		return 1
	fi
}

open_sync_pr() {
	local behind existing
	behind="$(gh api "repos/$FORK_REPO/compare/$INTEGRATION_BRANCH...$SYNC_BRANCH" --jq .ahead_by)" || return 1
	echo "== $INTEGRATION_BRANCH is $behind commit(s) behind $SYNC_BRANCH"
	[ "$behind" = "0" ] && return 0

	existing="$(gh pr list -R "$FORK_REPO" --base "$INTEGRATION_BRANCH" --head "$SYNC_BRANCH" --state open --json number --jq '.[0].number // empty')" || return 1
	if [ -n "$existing" ]; then
		echo "Sync PR #$existing is already open and tracks $SYNC_BRANCH automatically."
		return 0
	fi

	cat > "$tmp/pr.md" <<EOF
Brings $behind upstream commit(s) from \`$SYNC_BRANCH\` (mirror of [$UPSTREAM_REPO@$SYNC_BRANCH](https://github.com/$UPSTREAM_REPO/tree/$SYNC_BRANCH)) into \`$INTEGRATION_BRANCH\`.

This PR updates itself as the mirror advances.

- Merge with **Create a merge commit**. Squash or rebase would rewrite upstream history and make every later sync conflict.
- If there are conflicts, do **not** use GitHub's "Resolve conflicts" button: it would commit into \`$SYNC_BRANCH\` and break the mirror. Resolve locally instead (see FORK.md, "Resolving a conflicted sync").
EOF
	run gh pr create -R "$FORK_REPO" --base "$INTEGRATION_BRANCH" --head "$SYNC_BRANCH" \
		--title "Sync upstream $SYNC_BRANCH into $INTEGRATION_BRANCH" --body-file "$tmp/pr.md" --label upstream-sync
}

existing_release_titles() {
	gh issue list -R "$FORK_REPO" --label upstream-release --state all --limit 1000 --json title --jq '.[].title'
}

# Commits contained in an upstream ref that are not yet in our integration branch.
missing_in_integration() {
	local n
	if n="$(gh api "repos/$UPSTREAM_REPO/compare/$FORK_OWNER:$INTEGRATION_BRANCH...$1" --jq .ahead_by 2>/dev/null)"; then
		echo "$n"
	else
		echo '?'
	fi
}

create_release_issue() {
	echo "Opening issue: $1"
	if [ "$DRY_RUN" = "1" ]; then
		sed -n '1,6p' "$tmp/issue.md" | sed 's/^/    | /'
		return 0
	fi
	gh issue create -R "$FORK_REPO" --title "$1" --body-file "$tmp/issue.md" --label upstream-release
}

track_github_releases() {
	local since titles tag title
	since="$(date -u -d "-$RELEASE_LOOKBACK_DAYS days" +%Y-%m-%dT%H:%M:%SZ)"
	titles="$(existing_release_titles)" || return 1
	echo "== Checking upstream GitHub releases published since $since"

	gh release list -R "$UPSTREAM_REPO" --limit 50 --exclude-drafts --json tagName,publishedAt \
		--jq "map(select(.publishedAt >= \"$since\")) | sort_by(.publishedAt) | .[].tagName" > "$tmp/releases.txt" || return 1

	while read -r tag; do
		[ -z "$tag" ] && continue
		title="Upstream release $tag"
		if grep -Fxq "$title" <<<"$titles"; then
			continue
		fi
		# gh's built-in jq has no --arg, so values are passed through the environment.
		if ! MISSING="$(missing_in_integration "$tag")" TAG="$tag" MAIN="$INTEGRATION_BRANCH" UPSTREAM="$UPSTREAM_REPO" OWNER="$FORK_OWNER" \
			gh release view "$tag" -R "$UPSTREAM_REPO" --json name,body,isPrerelease,publishedAt,url --jq '
			"Upstream published **\(.name)** (\(if .isPrerelease then "pre-release" else "release" end)) on \(.publishedAt[0:10]).\n\n" +
			"- Release page: \(.url)\n" +
			"- Commits in `\(env.TAG)` not yet in our `\(env.MAIN)`: **\(env.MISSING)** ([compare](https://github.com/\(env.UPSTREAM)/compare/\(env.OWNER):\(env.MAIN)...\(env.TAG)))\n\n" +
			"### Checklist\n\n" +
			"- [ ] Read the notes below for fixes that touch our changes\n" +
			"- [ ] Merge the open `upstream-sync` PR, or cherry-pick release-only fixes (see FORK.md)\n" +
			"- [ ] Rebuild and test our apps\n\n" +
			"### Upstream release notes\n\n" + ((.body // "_No release notes._")[0:50000])
		' > "$tmp/issue.md" || [ ! -s "$tmp/issue.md" ]; then
			echo "::error::Could not build the issue for $tag"
			status=1
			continue
		fi
		create_release_issue "$title"
	done < "$tmp/releases.txt"
}

# Android and server releases are tags without GitHub releases, so track the newest tag per prefix.
track_platform_tags() {
	local titles prefix refs tag title missing changelog
	titles="$(existing_release_titles)" || return 1
	for prefix in $TRACKED_TAG_PREFIXES; do
		refs="$(git ls-remote --tags --refs "https://github.com/$UPSTREAM_REPO.git" "refs/tags/$prefix*")" || return 1
		tag="$(sed 's#.*refs/tags/##' <<<"$refs" | sort -V | tail -1)"
		[ -z "$tag" ] && continue
		title="Upstream release $tag"
		echo "== Latest $prefix tag: $tag"
		if grep -Fxq "$title" <<<"$titles"; then
			continue
		fi
		case "$prefix" in
			android-v) changelog=android ;;
			ios-v) changelog=ios ;;
			server-v) changelog=server ;;
			*) changelog=desktop ;;
		esac
		missing="$(missing_in_integration "$tag")"
		cat > "$tmp/issue.md" <<EOF
Upstream tagged **$tag**.

- Tag: https://github.com/$UPSTREAM_REPO/tree/$tag
- Changelog: https://github.com/$UPSTREAM_REPO/blob/$SYNC_BRANCH/readme/about/changelog/$changelog.md
- Commits in \`$tag\` not yet in our \`$INTEGRATION_BRANCH\`: **$missing** ([compare](https://github.com/$UPSTREAM_REPO/compare/$FORK_OWNER:$INTEGRATION_BRANCH...$tag))

### Checklist

- [ ] Read the changelog for fixes that touch our changes
- [ ] Merge the open \`upstream-sync\` PR, or cherry-pick release-only fixes (see FORK.md)
- [ ] Rebuild and test the affected app
EOF
		create_release_issue "$title"
	done
}

ensure_labels || status=1
sync_mirror || status=1
open_sync_pr || status=1
track_github_releases || status=1
track_platform_tags || status=1

exit "$status"
