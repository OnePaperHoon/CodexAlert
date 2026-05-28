---
name: cda-on
description: Codex 알림(codex-alert) 음소거 해제. 사용자가 "코덱스 알림 켜줘", "음소거 해제", "unmute/re-enable codex notifications" 등으로 Codex 알림을 다시 켜려 할 때 사용한다.
---

# cda-on — Codex 알림 음소거 해제

`~/.codex/notifications.disabled` 파일을 삭제해 codex-alert dispatcher가 다시 발화하게 한다. 아래에서 OS에 맞는 한 줄을 실행하라.

- Windows (PowerShell):
  Remove-Item "$env:USERPROFILE\.codex\notifications.disabled" -ErrorAction SilentlyContinue
- macOS / Linux:
  rm -f "$HOME/.codex/notifications.disabled"

규칙: 파일이 없어도 에러 아님. 실행 후 한 줄로만 답하라(예: "알림 켰어요."). 부연설명·다음 단계 제안 금지.
