import type { EventName } from '../settings/types.js';

export type Locale = 'en' | 'ko';

/**
 * 이벤트별 디폴트 토스트 메시지. locale 텍스트의 단일 원천.
 * `cda init`이 이 매핑 텍스트를 cda-config.json의 events.{Event}.message에 박는다.
 * dispatcher는 별도 매핑 없이 cda-config의 message를 그대로 사용 (null이면 event name fallback).
 */
export const DEFAULT_MESSAGES: Record<Locale, Record<EventName, string>> = {
  en: {
    Stop: 'Turn complete',
    PermissionRequest: 'Permission needed',
    UserPromptSubmit: 'Prompt submitted',
    SessionStart: 'Session started',
    SubagentStart: 'Subagent started',
    SubagentStop: 'Subagent complete',
    PreToolUse: 'Tool ...',
    PostToolUse: 'Tool done',
    PreCompact: 'Compacting...',
    PostCompact: 'Compact complete',
  },
  ko: {
    Stop: '응답이 끝났어요',
    PermissionRequest: '권한이 필요해요',
    UserPromptSubmit: '입력을 받았어요',
    SessionStart: '세션을 시작했어요',
    SubagentStart: '서브 에이전트 시작',
    SubagentStop: '서브 에이전트 완료',
    PreToolUse: '도구를 호출해요',
    PostToolUse: '도구가 끝났어요',
    PreCompact: '대화를 정리하고 있어요',
    PostCompact: '대화 정리 완료',
  },
};
