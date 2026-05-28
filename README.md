# codex-alert (`cda`)

OpenAI [Codex CLI](https://developers.openai.com/codex/) lifecycle hook 이벤트에 사운드 + 토스트 알림을 띄워주는 크로스플랫폼 라이브러리. Windows / macOS 지원.

설치하면 `cda` 명령으로 사용합니다.

## 설치

전역 설치 (권장):

```bash
npm install -g codex-alert
cda init
```

또는 일회성 실행:

```bash
npx codex-alert init
```

`init`은 대화형 프롬프트로 다음을 수행합니다.

1. `~/.codex/hooks.json`에 이미 등록된 hook을 감지하고 충돌 처리 방식을 묻습니다.
2. 알림 받을 이벤트를 고릅니다 (Basic 5개 + Advanced 5개).
3. Advanced 이벤트(PreToolUse 등)를 켜면 tool name regex(matcher)를 묻습니다.
4. 원하면 이벤트별로 사운드와 메시지를 따로 설정할 수 있습니다.
5. 변경 내용(diff)을 미리 보여주고, 확인을 받은 뒤에만 적용합니다.
6. `hooks.json`을 `~/.codex/cda-backups/`에 자동 백업합니다 (최근 3개 유지).
7. Codex 스킬 `cda-off`, `cda-on`을 `~/.codex/skills/`에 설치합니다.

## ⚠ `/hooks` Trust 단계 (반드시!)

Codex CLI는 non-managed hook을 등록한 직후에는 **trust 처리 전까지 발화하지 않습니다.** `cda init` 완료 후:

1. `codex` 실행
2. `/hooks` 입력
3. 목록에서 `cda` hook을 찾아 **trust** 선택

이 과정을 거치지 않으면 토스트가 뜨지 않습니다. `cda status`의 마지막 줄에 이 안내가 항상 표시됩니다.

## 명령어

| 명령 | 동작 |
|------|------|
| `cda init`      | hook 설치 / 재설정 (대화형) |
| `cda status`    | 현재 설치 상태 확인 |
| `cda disable`   | 알림 음소거 (`~/.codex/notifications.disabled` 생성) |
| `cda enable`    | 음소거 해제 |
| `cda uninstall` | 우리 hook만 제거 (사용자가 직접 등록한 hook은 손대지 않음) |

## Codex 안에서 토글

`cda init`은 Codex 스킬도 함께 설치합니다 (`~/.codex/skills/cda-off`, `cda-on`). Codex 세션 안에서 말로 음소거할 수 있습니다.

- "코덱스 알림 꺼줘 / 음소거" → `cda-off` 스킬이 `~/.codex/notifications.disabled`를 생성
- "코덱스 알림 켜줘 / 해제" → `cda-on` 스킬이 삭제

`cda disable`/`enable`(CLI)과 **동일한 플래그**를 토글하므로 상태가 항상 일치합니다. `cda uninstall`에서 함께 제거할 수 있습니다.

> - 신규 스킬은 codex를 **재시작**해야 인식될 수 있습니다.
> - 스킬이 워크스페이스 밖(`~/.codex`)에 파일을 쓰므로, 샌드박스 설정에 따라 **쓰기 승인**이 필요할 수 있습니다.

## 이벤트 라인업

### Basic (저빈도, 의미있는 알림)

| Event | 디폴트 | 의미 |
|---|---|---|
| `Stop` | ✓ | 한 turn 종료 / 입력 대기 |
| `PermissionRequest` | ✓ | 권한 요청 (위험한 명령 실행 전 등) |
| `UserPromptSubmit` | | 사용자 prompt 제출 |
| `SessionStart` | | 세션 시작 |
| `SubagentStop` | | 서브에이전트 완료 |

### Advanced (고빈도, 폭탄 위험)

| Event | matcher 디폴트 | 의미 |
|---|---|---|
| `PreToolUse` | `Bash\|apply_patch` | 도구 호출 전 — `Edit`/`Write`/`Read`는 alias로 사용 가능 |
| `PostToolUse` | `Bash\|apply_patch` | 도구 호출 후 |
| `PreCompact` | `*` | compaction 전 |
| `PostCompact` | `*` | compaction 후 |
| `SubagentStart` | `*` | 서브에이전트 시작 |

> Advanced 이벤트는 도구 호출마다 발화될 수 있으니 matcher를 좁게 잡으세요.

## 동작 원리

- 작은 dispatcher 스크립트를 `~/.codex/scripts/cda.{ps1,sh}`에 배치하고, 설정값은 `~/.codex/cda-config.json`에 저장합니다.
- `hooks.json`에는 각 이벤트마다 dispatcher를 가리키는 명령 한 줄만 추가됩니다 (현재 머신 platform용 단일 `command`).
- hook이 발화되면 dispatcher가 `cda-config.json`을 읽고 그에 맞춰 토스트와 사운드를 띄웁니다.

→ 알림 사운드나 메시지를 바꾸고 싶을 때 `cda-config.json`만 수정하면 됩니다. matcher를 바꾸려면 `cda init`을 재실행하세요 (matcher는 `hooks.json`이 단일 진실 원천).

## 사운드 커스터마이즈

`cda init` 중 "Custom file..."을 고르고 경로를 입력하세요.

- **Windows**: `.wav` 만 허용
- **macOS**: `.wav`, `.aiff`, `.mp3`, `.m4a`, `.caf` 허용

입력한 파일은 `~/.codex/sounds/`로 복사되고 `cda-config.json`에 파일명으로 기록됩니다.

## 충돌 처리

### `hooks.json` 내부 충돌 (`cda init` 중)

같은 이벤트에 다른 hook이 등록되어 있는 걸 발견하면 세 가지 선택지를 줍니다.

- **Append** (기본): 기존 hook과 우리 hook이 둘 다 발화. 알림이 두 번 뜰 수 있습니다.
- **Skip**: 기존 hook 유지, 그 이벤트에는 우리 hook 추가하지 않음.
- **Abort**: 아무 변경도 하지 않고 종료.

hook 식별은 `command` 문자열 안의 dispatcher 경로를 기준으로 합니다. **우리가 만들지 않은 hook은 절대 손대지 않습니다.**

### `~/.codex/config.toml`과의 다중 소스 충돌

Codex는 `~/.codex/hooks.json`과 `~/.codex/config.toml`의 `[[hooks.X]]`를 **둘 다 로드해서 concurrent 실행**합니다. CodexAlert는 `hooks.json`만 관리하고 `config.toml`은 절대 수정하지 않습니다.

`cda init` / `cda status`는 `config.toml`에 같은 이벤트의 hook이 있으면 경고를 출력합니다. 두 hook이 동시에 발화되어 알림이 두 번 뜰 수 있음을 알려주는 정보 안내입니다.

## 제거

```bash
cda uninstall
```

`command`가 우리 dispatcher를 가리키는 hook만 골라서 제거합니다. 다른 hook은 그대로 남습니다. dispatcher 스크립트, 설정 파일, 토글 스킬(`cda-off`, `cda-on`), 사용자가 등록한 사운드 파일도 함께 지울지 선택할 수 있습니다.

## 플랫폼 요구사항

- **Windows**: Windows 10 / 11, PowerShell 5.1 (기본 탑재). WinRT Toast API + `Media.SoundPlayer` 사용.
- **macOS**: `osascript`, `afplay`, `python3` 사용 (모두 기본 탑재). Notification Center로 표시.
- **Node**: 18 이상 (설치 시점에만 필요. hook 발화 시에는 Node가 관여하지 않음)
- **Codex CLI**: hook 시스템이 안정화된 최신 버전.

## 트러블슈팅

| 증상 | 확인 |
|------|------|
| 알림이 안 뜸 | `codex` 안에서 `/hooks`를 실행하고 cda hook을 trust 했나요? |
| 알림이 안 뜸 | `~/.codex/notifications.disabled`가 있나요? `cda enable` 실행. |
| `cda-off`/`cda-on` 스킬이 안 보임 | codex를 재시작해 스킬을 다시 인덱싱하세요. |
| 스킬이 플래그 파일을 못 씀 | 워크스페이스 밖 쓰기라 샌드박스 승인이 필요할 수 있습니다. 승인하거나 `cda disable`/`enable`(CLI)을 사용하세요. |
| 알림이 두 번 뜸 | 같은 이벤트에 다른 hook이 있는 상태에서 "append"를 선택했거나, `config.toml`에도 같은 이벤트 hook이 있는 경우입니다. |
| 토스트는 뜨는데 사운드가 안 남 | `cda-config.json`의 사운드 경로가 실제로 존재하나요? Windows에서는 `.wav`만 재생됩니다. |
| `hooks.json`이 깨졌어요 | `~/.codex/cda-backups/hooks.YYYYMMDD-HHmm.json`에서 복구하세요. |
| 다른 OS로 옮겨도 동작하나요? | 아니오. `command` 필드가 현재 머신의 절대 경로 기반이라 OS가 바뀌면 그 머신에서 `cda init` 재실행이 필요합니다. |

## 참고: ClaudeCodeAlert

이 라이브러리는 [Claude Code](https://claude.com/claude-code)용 자매 라이브러리 [`claude-code-alert`](https://www.npmjs.com/package/claude-code-alert) (`cca`)의 아키텍처 패턴을 참고했지만, 독립된 별개 라이브러리입니다. Claude Code 안에서는 `/cca-off`·`/cca-on` 슬래시 커맨드로 토글합니다. 음소거 플래그가 `~/.codex`와 `~/.claude`로 분리되어 있어 한 시스템에 둘 다 설치해서 서로 독립적으로 사용할 수 있습니다.

## 변경 이력

### 1.0.0
- 정식 1.0 릴리스.
- Codex 스킬 `cda-off`, `cda-on` 추가 — Codex 세션 안에서 말로 알림 음소거 토글. `cda init`이 설치하고 `cda uninstall`에서 제거.
- `cda status`에 토글 스킬 설치 여부 표시.
- `cda disable`/`enable`(CLI)과 동일한 음소거 플래그를 공유 → 상태 정합 보장.

## 라이선스

MIT
