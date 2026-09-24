#!/usr/bin/env bash
# PostToolUse hook (Edit|MultiEdit|Write): runs svelte-check, prettier, eslint and
# (if present) the npm test script for the edited file. Problems are reported back
# to Claude via exit code 2 so they get fixed right away.
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
FILE="$(jq -r '.tool_input.file_path // empty')"
[[ -z "$FILE" ]] && exit 0
REL="$(realpath -m --relative-to="$ROOT" "$FILE")"

# Only project code; skip docs, agent config, generated output.
case "$REL" in
../* | .claude/* | node_modules/* | build/* | .svelte-kit/* | static/*) exit 0 ;;
esac
case "$REL" in
*.svelte | *.ts | *.js | *.mjs | *.cjs | *.css | *.html | *.json) ;;
*) exit 0 ;;
esac

cd "$ROOT" || exit 0
report=""

if ! out="$(npx prettier --check "$REL" 2>&1)"; then
	report+=$'\n## prettier\n'"$out"$'\n(fix: npx prettier --write '"$REL"$')\n'
fi

case "$REL" in
*.svelte | *.ts | *.js | *.mjs | *.cjs)
	if ! out="$(npx eslint "$REL" 2>&1)"; then
		report+=$'\n## eslint\n'"$out"$'\n'
	fi
	;;
esac

case "$REL" in
*.svelte | *.ts | *.js)
	npx svelte-kit sync >/dev/null 2>&1
	# Whole-project type check, but only report errors located in the edited file.
	out="$(npx svelte-check --tsconfig ./tsconfig.json --output machine --threshold error 2>&1 |
		grep -F " ERROR \"$REL\"" || true)"
	if [[ -n "$out" ]]; then
		report+=$'\n## svelte-check (errors in '"$REL"$')\n'"$out"$'\n'
	fi
	;;
esac

if jq -e '.scripts.test' package.json >/dev/null 2>&1; then
	if ! out="$(timeout 300 npm test --silent 2>&1)"; then
		report+=$'\n## npm test\n'"$(tail -40 <<<"$out")"$'\n'
	fi
fi

if [[ -n "$report" ]]; then
	echo "Automatische Checks für $REL haben Probleme gefunden (evtl. teils vorbestehend):$report" >&2
	exit 2
fi
exit 0
