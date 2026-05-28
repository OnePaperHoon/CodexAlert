---
name: cda-off
description: Codex 알림(codex-alert) 음소거. 사용자가 "코덱스 알림 꺼줘", "알림 음소거", "mute/silence codex notifications" 등으로 Codex의 토스트/사운드 알림을 끄려 할 때 사용한다.
---

# cda-off — Codex 알림 음소거

`~/.codex/notifications.disabled` 빈 파일을 만들어 codex-alert dispatcher가 발화하지 않게 한다. 아래에서 OS에 맞는 한 줄을 실행하라.

- Windows (PowerShell):
  New-Item -ItemType File -Path "$env:USERPROFILE\.codex\notifications.disabled" -Force | Out-Null
- macOS / Linux:
  touch "$HOME/.codex/notifications.disabled"

규칙: 파일이 이미 있어도 OK(에러 아님). 실행 후 한 줄로만 답하라(예: "알림 껐어요."). 부연설명·다음 단계 제안 금지.
