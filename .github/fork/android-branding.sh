#!/usr/bin/env bash
# Rebrands the Android app for fork builds without committing changes to upstream files. See FORK.md.
#
# Required env: FORK_APP_ID (e.g. io.github.example.notes), FORK_APP_NAME (launcher label).
# Optional env: FORK_BUILD_NUMBER (defaults to 0), used to make versionCode/versionName unique per build.
#
# Run from the repository root, before `./gradlew assembleRelease`. It edits the working tree only.

set -euo pipefail

: "${FORK_APP_ID:?Set FORK_APP_ID, for example io.github.example.notes}"
: "${FORK_APP_NAME:?Set FORK_APP_NAME, the name shown under the app icon}"
FORK_BUILD_NUMBER="${FORK_BUILD_NUMBER:-0}"

gradle_file=packages/app-mobile/android/app/build.gradle
strings_file=packages/app-mobile/android/app/src/main/res/values/strings.xml

if ! [[ "$FORK_APP_ID" =~ ^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$ ]]; then
	echo "::error::FORK_APP_ID '$FORK_APP_ID' is not a valid Android application ID"
	exit 1
fi

# Restricting the name avoids escaping it for XML, Android string resources and sed.
if ! [[ "$FORK_APP_NAME" =~ ^[A-Za-z0-9][A-Za-z0-9\ ._-]{0,29}$ ]]; then
	echo "::error::FORK_APP_NAME may only contain letters, digits, spaces, '.', '_' and '-' (max 30 characters)"
	exit 1
fi

upstream_code="$(sed -nE 's/^\s*versionCode ([0-9]+).*/\1/p' "$gradle_file" | head -1)"
upstream_name="$(sed -nE 's/^\s*versionName "([^"]+)".*/\1/p' "$gradle_file" | head -1)"
if [ -z "$upstream_code" ] || [ -z "$upstream_name" ]; then
	echo "::error::Could not read versionCode/versionName from $gradle_file; upstream may have changed its format"
	exit 1
fi

# Two extra digits keep codes increasing across upstream bumps while allowing 100 fork builds per upstream version.
fork_code=$(( upstream_code * 100 + FORK_BUILD_NUMBER % 100 ))
fork_name="${upstream_name}-fork.${FORK_BUILD_NUMBER}"

sed -i -E "s/^(\s*applicationId )\"[^\"]+\"/\1\"${FORK_APP_ID}\"/" "$gradle_file"
sed -i -E "s/^(\s*versionCode )[0-9]+/\1${fork_code}/" "$gradle_file"
sed -i -E "s/^(\s*versionName )\"[^\"]+\"/\1\"${fork_name}\"/" "$gradle_file"

sed -i -E "s|(<string name=\"app_name\">)[^<]*(</string>)|\1${FORK_APP_NAME}\2|" "$strings_file"

grep -q "applicationId \"${FORK_APP_ID}\"" "$gradle_file" || { echo "::error::applicationId was not replaced"; exit 1; }
grep -q "versionCode ${fork_code}" "$gradle_file" || { echo "::error::versionCode was not replaced"; exit 1; }
grep -q '<string name="app_name">' "$strings_file" || { echo "::error::app_name was not found"; exit 1; }

echo "Branded Android build: id=${FORK_APP_ID} name=${FORK_APP_NAME} version=${fork_name} (${fork_code})"
if [ -n "${GITHUB_OUTPUT:-}" ]; then
	echo "version_name=${fork_name}" >> "$GITHUB_OUTPUT"
	echo "version_code=${fork_code}" >> "$GITHUB_OUTPUT"
fi
