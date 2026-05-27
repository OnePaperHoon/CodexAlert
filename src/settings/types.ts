export const BASIC_EVENTS = [
  'Stop', 'PermissionRequest', 'UserPromptSubmit',
  'SessionStart', 'SubagentStop',
] as const;

export const ADVANCED_EVENTS = [
  'PreToolUse', 'PostToolUse', 'PreCompact', 'PostCompact', 'SubagentStart',
] as const;

export const ALL_EVENTS = [...BASIC_EVENTS, ...ADVANCED_EVENTS] as const;
export type EventName = typeof ALL_EVENTS[number];

export const DEFAULT_ENABLED: EventName[] = ['Stop', 'PermissionRequest'];

/** Advanced 이벤트 matcher 디폴트 (Basic은 항상 "*") */
export const DEFAULT_MATCHERS: Partial<Record<EventName, string>> = {
  PreToolUse: 'Bash|apply_patch',
  PostToolUse: 'Bash|apply_patch',
  PreCompact: '*',
  PostCompact: '*',
  SubagentStart: '*',
};

export interface CdaEventConfig {
  enabled: boolean;
  sound: string;          // 'default' | 파일명 (~/.codex/sounds/ 안)
  message: string | null; // null이면 dispatcher가 event name fallback
}

export interface CdaConfig {
  version: 1;
  locale: 'en' | 'ko';
  events: Record<EventName, CdaEventConfig>;
  defaults: {
    sound_win: string;
    sound_mac: string;
  };
}

export interface HookCommandNode {
  type: 'command';
  command: string;
  // commandWindows 필드는 Codex 스펙에 존재하나 우리는 사용하지 않음.
  // 우리 설치 모델이 한 머신 가정이므로 dual command를 박는 의의가 없고,
  // ~/.codex/scripts/ 경로는 머신마다 다른 homedir 기반이라 sync 가치도 환상.
}

export interface HookMatcherNode {
  matcher?: string;
  hooks: HookCommandNode[];
}

export interface HooksFile {
  hooks?: Partial<Record<EventName, HookMatcherNode[]>>;
  [k: string]: unknown;
}
