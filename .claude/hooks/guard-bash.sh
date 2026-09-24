#!/usr/bin/env bash
# PreToolUse guard for Bash, used in the agent frontmatter hooks.
# Usage: guard-bash.sh implementer|reviewer
# Blocks commands outside the agent's role (exit 2 = tool call denied, reason goes to the agent).
set -uo pipefail

ROLE="${1:-}"
CMD="$(jq -r '.tool_input.command // empty')"

deny() {
	echo "Blockiert für Rolle '$ROLE': $1. Das ist Aufgabe des deployer-Agents (siehe CLAUDE.md)." >&2
	exit 2
}

# Both roles: never commit / change git history, never build prod, never touch pm2 state.
grep -Eq '(^|[;&|[:space:]])git[[:space:]]+(commit|push|reset|rebase|merge|tag|revert|stash|checkout|switch|restore|clean|add|rm|mv)\b' <<<"$CMD" &&
	deny "git-Schreiboperation"
grep -Eq '(npm|pnpm|yarn)[[:space:]]+(run[[:space:]]+)?build\b|vite[[:space:]]+build\b' <<<"$CMD" &&
	deny "Production-Build"
grep -Eq '(^|[;&|[:space:]])pm2[[:space:]]+(restart|reload|start|stop|delete|kill|save|startOrRestart|startOrReload|update|resurrect|flush)\b' <<<"$CMD" &&
	deny "pm2-Prozesssteuerung"
grep -Eq '(^|[[:space:]/])(build|rezepte\.db)([[:space:]/]|$)' <<<"$CMD" && grep -Eq '(^|[;&|[:space:]])(rm|mv|cp|rsync)[[:space:]]' <<<"$CMD" &&
	deny "Schreibzugriff auf build/ oder die Produktions-DB"

if [[ "$ROLE" == "reviewer" ]]; then
	# Reviewer only reads: no auto-fixers, no file writes into the repo.
	grep -Eq 'prettier[^|;&]*(--write|-w\b)|eslint[^|;&]*--fix|npm[[:space:]]+run[[:space:]]+format\b' <<<"$CMD" &&
		deny "Auto-Fix (Reviewer ändert keinen Code)"
	grep -Eq '(^|[;&|[:space:]])(sed[[:space:]]+-i|tee|rm|mv|truncate|npm[[:space:]]+(install|i|uninstall|update|ci))\b' <<<"$CMD" &&
		grep -Eqv '(/tmp/|\.cache/kochseite-preview|scratchpad)' <<<"$CMD" &&
		deny "Schreibender Befehl (Reviewer ist read-only)"
	grep -Eq '(^|[^<>0-9&])>>?[[:space:]]*(\./)?(src|static|package\.json|svelte\.config|vite\.config|CLAUDE\.md)' <<<"$CMD" &&
		deny "Umleitung in Projektdateien (Reviewer ist read-only)"
fi
exit 0
