#!/usr/bin/env bash
# Isolated dev preview for review purposes.
# Copies the working tree (incl. uncommitted changes) plus a snapshot of rezepte.db
# to a sandbox outside the repo and runs `vite dev` there, so reviews never touch
# the production DB, build/ or the pm2 process.
#
# Usage: .claude/scripts/preview-sandbox.sh start|stop|status
#   env: PREVIEW_PORT (default 5199), PREVIEW_SANDBOX (default ~/.cache/kochseite-preview)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SANDBOX="${PREVIEW_SANDBOX:-$HOME/.cache/kochseite-preview}"
PORT="${PREVIEW_PORT:-5199}"
PIDFILE="$SANDBOX.pid"
LOG="$SANDBOX.log"

stop() {
	pkill -f "$SANDBOX/node_modules/.bin/vite" 2>/dev/null || true
	rm -f "$PIDFILE"
	for _ in $(seq 1 20); do
		curl -s -o /dev/null "http://127.0.0.1:$PORT/" || break
		sleep 0.25
	done
}

case "${1:-}" in
start)
	stop
	mkdir -p "$SANDBOX"
	rsync -a --delete \
		--exclude node_modules --exclude .git --exclude build --exclude .svelte-kit \
		--exclude rezepte.db --exclude 'rezepte.db-*' --exclude 'static/uploads' \
		"$ROOT/" "$SANDBOX/"
	ln -sfn "$ROOT/node_modules" "$SANDBOX/node_modules"
	mkdir -p "$SANDBOX/static/uploads"
	# node_modules is a symlink into the repo; allow Vite to serve from there.
	cat >"$SANDBOX/vite.sandbox.config.ts" <<CFG
import { mergeConfig } from 'vite';
import base from './vite.config';
export default mergeConfig(base, { server: { fs: { allow: ['$SANDBOX', '$ROOT/node_modules'] } } });
CFG
	# Consistent snapshot of the live DB (the sandbox works on its own copy).
	(cd "$ROOT" && node -e "
		const D = require('better-sqlite3');
		new D('rezepte.db', { readonly: true }).backup(process.argv[1]).then(() => process.exit(0));
	" "$SANDBOX/rezepte.db")
	(cd "$SANDBOX" && setsid nohup "$SANDBOX/node_modules/.bin/vite" dev --config vite.sandbox.config.ts \
		--host 127.0.0.1 --port "$PORT" --strictPort >"$LOG" 2>&1 &
		echo $! >"$PIDFILE")
	for _ in $(seq 1 60); do
		if curl -sf -o /dev/null "http://127.0.0.1:$PORT/"; then
			echo "preview ready: http://127.0.0.1:$PORT (sandbox $SANDBOX, log $LOG)"
			exit 0
		fi
		sleep 0.5
	done
	echo "preview failed to start, see $LOG" >&2
	tail -20 "$LOG" >&2
	exit 1
	;;
stop)
	stop
	echo "preview stopped"
	;;
status)
	if pgrep -f "$SANDBOX/node_modules/.bin/vite" >/dev/null; then
		echo "running: http://127.0.0.1:$PORT"
	else
		echo "not running"
	fi
	;;
*)
	echo "usage: $0 start|stop|status" >&2
	exit 2
	;;
esac
