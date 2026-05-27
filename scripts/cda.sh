#!/bin/bash
# codex-alert dispatcher (macOS)
set +e

CODEX_DIR="$HOME/.codex"
DISABLED="$CODEX_DIR/notifications.disabled"
CONFIG="$CODEX_DIR/cda-config.json"

[ -f "$DISABLED" ] && exit 0
[ ! -f "$CONFIG" ] && exit 0

STDIN_JSON=$(cat)
[ -z "$STDIN_JSON" ] && exit 0

EVENT=$(STDIN_JSON="$STDIN_JSON" python3 - <<'PY' 2>/dev/null
import os, json
try:
    d = json.loads(os.environ.get("STDIN_JSON", ""))
    print(d.get("hook_event_name", ""))
except Exception:
    pass
PY
)
[ -z "$EVENT" ] && exit 0

RESULT=$(python3 - "$CONFIG" "$EVENT" <<'PY' 2>/dev/null
import sys, json, os

cfg_path, event = sys.argv[1], sys.argv[2]

try:
    with open(cfg_path, encoding='utf-8') as f:
        cfg = json.load(f)
    ev = cfg.get("events", {}).get(event)
    if not ev or not ev.get("enabled"):
        sys.exit(0)
    sound = ev.get("sound") or "default"
    if sound == "default":
        sound = cfg.get("defaults", {}).get("sound_mac", "")
    else:
        sound = os.path.expanduser(f"~/.codex/sounds/{sound}")
    message = ev.get("message") or event
    print(sound)
    print(message)
except Exception:
    sys.exit(0)
PY
)
[ -z "$RESULT" ] && exit 0

SOUND=$(printf '%s\n' "$RESULT" | sed -n '1p')
MSG=$(printf '%s\n' "$RESULT" | sed -n '2p')

# AppleScript 문자열 안에서 백슬래시·큰따옴표 escape, 개행 제거
SAFE_MSG=$(printf '%s' "$MSG" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' | tr -d '\r\n')
osascript -e "display notification \"$SAFE_MSG\" with title \"Codex\"" >/dev/null 2>&1

if [ -n "$SOUND" ] && [ -f "$SOUND" ]; then
    (afplay "$SOUND" >/dev/null 2>&1 &)
fi

exit 0
