#!/usr/bin/env bash
# Fails if the fork's own changes contain private information: private keys, access tokens, private network
# addresses, email addresses (other than no-reply and example ones), or any personal pattern of the maintainer.
# Only lines the fork adds are checked, not upstream's. See FORK.md.
#
# Usage: check-private-info.sh            Checks the commits since the upstream mirror (origin/dev).
#        check-private-info.sh --staged   Checks the staged changes (the pre-commit hook).
#
# Personal patterns (extended regular expressions, one per line) come from the FORK_PRIVATE_PATTERNS variable or
# from the file in FORK_PRIVATE_PATTERNS_FILE (default ~/.config/inkbench/private-patterns.txt). They are never
# printed: a match only reports its file and line, because CI logs are public.

set -euo pipefail

mode="${1:-commits}"
patterns_file="${FORK_PRIVATE_PATTERNS_FILE:-$HOME/.config/inkbench/private-patterns.txt}"

generic_patterns=(
	'-----BEGIN [A-Z ]*PRIVATE KEY-----'
	'(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}'
	'github_pat_[A-Za-z0-9_]{30,}'
	'AKIA[0-9A-Z]{16}'
	'xox[abprs]-[A-Za-z0-9-]{10,}'
	'sk-[A-Za-z0-9]{32,}'
	'(^|[^0-9.])(10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|192\.168\.[0-9]{1,3}\.[0-9]{1,3}|172\.(1[6-9]|2[0-9]|3[01])\.[0-9]{1,3}\.[0-9]{1,3})([^0-9.]|$)'
)
email_pattern='[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
allowed_email_pattern='@(users\.noreply\.github\.com|example\.(com|org|net)|joplinapp\.org|anthropic\.com)$'

personal_patterns=()
add_personal_patterns() {
	while IFS= read -r line; do
		line="${line%$'\r'}"
		[ -n "$line" ] && [ "${line:0:1}" != "#" ] && personal_patterns+=("$line")
	done
}
if [ -n "${FORK_PRIVATE_PATTERNS:-}" ]; then add_personal_patterns <<< "$FORK_PRIVATE_PATTERNS"; fi
if [ -f "$patterns_file" ]; then add_personal_patterns < "$patterns_file"; fi

if [ "$mode" = "--staged" ]; then
	diff_args=(--cached)
else
	base="$(git merge-base HEAD origin/dev)"
	diff_args=("$base" HEAD)
fi

# Prints "file<TAB>line<TAB>text" for every added line, skipping lock files and binary files.
added_lines() {
	git diff --no-color --no-ext-diff -U0 "${diff_args[@]}" -- . ':(exclude)*.lock' ':(exclude)*.lockb' | awk '
		/^\+\+\+ b\// { file = substr($0, 7); next }
		/^@@/ { split($3, range, ","); line = substr(range[1], 2) + 0; next }
		/^\+/ && !/^\+\+\+/ { printf "%s\t%d\t%s\n", file, line, substr($0, 2); line++ }
	'
}

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
added_lines > "$tmp/added.tsv"
cut -f3- "$tmp/added.tsv" > "$tmp/text.txt"

found=0
# Reports the added lines whose numbers (in text.txt) are in rows.txt. Each check is one pass over all the lines,
# which keeps it fast even for tens of thousands of lines.
report_rows() {
	if ! awk -F'\t' -v message="$1" '
		NR == FNR { rows[$1] = 1; next }
		(FNR in rows) { printf "::error file=%s,line=%s::%s\n", $1, $2, message; matched = 1 }
		END { exit matched ? 3 : 0 }
	' "$tmp/rows.txt" "$tmp/added.tsv"; then
		found=1
	fi
}

for pattern in "${generic_patterns[@]}"; do
	{ grep -nE -- "$pattern" "$tmp/text.txt" || true; } | cut -d: -f1 > "$tmp/rows.txt"
	report_rows 'A private key, access token or private network address'
done

{ grep -noE -- "$email_pattern" "$tmp/text.txt" || true; } | { grep -viE -- "$allowed_email_pattern" || true; } | cut -d: -f1 > "$tmp/rows.txt"
report_rows 'An email address'

for index in "${!personal_patterns[@]}"; do
	{ grep -niE -- "${personal_patterns[$index]}" "$tmp/text.txt" || true; } | cut -d: -f1 > "$tmp/rows.txt"
	report_rows "Personal pattern #$((index + 1))"
done

if [ "$found" = "1" ]; then
	echo "Private information found in the fork's changes (see above). Remove it before committing or pushing."
	exit 1
fi
echo "No private information found in $(wc -l < "$tmp/added.tsv") added line(s) (${#personal_patterns[@]} personal pattern(s) checked)."
