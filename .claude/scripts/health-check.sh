#!/usr/bin/env bash
# Post-deploy health check for the pm2 app "kochseite".
# Usage: .claude/scripts/health-check.sh [error-log-offset-bytes]
#   Pass the error log size taken right before `pm2 reload` to only show new error lines.
# Exit 0 = healthy, 1 = unhealthy.
set -uo pipefail

NAME=kochseite
PORT=187
ERRLOG="$HOME/.pm2/logs/$NAME-error.log"
OFFSET="${1:-}"
ROUTES=(/ /rezepte /rezepte/neues-rezept /einkauf /aufgaben)
ok=1

state() { pm2 jlist 2>/dev/null | jq -r --arg n "$NAME" '.[] | select(.name==$n) | "\(.pm2_env.status) \(.pm2_env.restart_time) \(.pm2_env.unstable_restarts) \(.pid)"'; }

for _ in $(seq 1 30); do
	read -r status restarts unstable pid <<<"$(state)"
	[[ "$status" == "online" ]] && curl -s -o /dev/null "http://127.0.0.1:$PORT/" && break
	sleep 1
done
echo "pm2: status=$status restarts=$restarts unstable=$unstable pid=$pid"
[[ "$status" == "online" ]] || ok=0

# Stability: must still be the same process after a few seconds (no crash loop).
sleep 4
read -r status2 restarts2 _ pid2 <<<"$(state)"
if [[ "$status2" != "online" || "$restarts2" != "$restarts" || "$pid2" != "$pid" ]]; then
	echo "UNSTABLE: status=$status2 restarts=$restarts2 pid=$pid2"
	ok=0
fi

for r in "${ROUTES[@]}"; do
	code="$(curl -s -o /dev/null -w '%{http_code} %{time_total}s' "http://127.0.0.1:$PORT$r")"
	echo "GET $r -> $code"
	[[ "$code" == 200* ]] || ok=0
done

echo "--- neue Zeilen im Error-Log ---"
if [[ -n "$OFFSET" ]]; then
	tail -c +"$((OFFSET + 1))" "$ERRLOG" | grep -v '^\s*$' | tail -30 || true
else
	pm2 logs "$NAME" --err --lines 15 --nostream 2>/dev/null | tail -15
fi
echo "--- letzte Out-Log-Zeilen ---"
pm2 logs "$NAME" --out --lines 5 --nostream 2>/dev/null | tail -5

if [[ $ok -eq 1 ]]; then echo "HEALTHY"; exit 0; else echo "UNHEALTHY"; exit 1; fi
