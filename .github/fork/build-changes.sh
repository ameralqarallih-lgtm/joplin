#!/usr/bin/env bash
# Prints, as Markdown, the commits since the build published on the given rolling release (android-latest or
# desktop-latest), for that release's notes. See FORK.md.
#
# Usage: build-changes.sh <release tag>    Needs GH_TOKEN, GITHUB_REPOSITORY and GITHUB_SHA, as in GitHub Actions.

set -euo pipefail

tag="$1"
previous="$(gh release view "$tag" -R "$GITHUB_REPOSITORY" --json targetCommitish --jq .targetCommitish 2>/dev/null || true)"

echo "### Changes since the previous build"
echo
if [ -z "$previous" ]; then
	echo "This is the first build published here."
	exit 0
fi
if [ "$previous" = "$GITHUB_SHA" ]; then
	echo "None: this build is from the same commit as the previous one."
	exit 0
fi

# Merges and documentation-only commits don't change the app.
if ! commits="$(gh api "repos/$GITHUB_REPOSITORY/compare/$previous...$GITHUB_SHA" \
	--jq '.commits[] | select(.parents | length == 1) | "- " + (.commit.message | split("\n")[0]) + " (" + .sha[0:9] + ")"' 2>/dev/null)"; then
	echo "The changes since ${previous:0:9} couldn't be listed."
	exit 0
fi
changes="$(grep -v -E '^- Doc: ' <<< "$commits" || true)"

if [ -n "$changes" ]; then
	echo "$changes"
else
	echo "No app changes since ${previous:0:9}."
fi
echo
echo "Compare: https://github.com/$GITHUB_REPOSITORY/compare/${previous:0:9}...${GITHUB_SHA:0:9}"
