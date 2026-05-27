import { writeFile } from 'node:fs/promises';
import { paths, normalizePath, dispatcherCommandPath } from '../platform/paths.js';
import { detectPlatform } from '../platform/detect.js';
import type {
  HooksFile, HookMatcherNode, EventName, CdaConfig,
} from './types.js';

/**
 * dispatcher 호출 명령 빌드.
 * 우리 설치 모델은 한 머신 가정이라 현재 platform용 단일 command만 박는다.
 * commandWindows 필드는 사용하지 않음 (~/.codex/scripts/ 경로가 머신마다 다른
 * homedir 기반이라 다른 OS에서 의미 없는 경로가 되기 때문).
 */
function buildOurCommand(): string {
  const platform = detectPlatform();
  const path = dispatcherCommandPath(platform);
  return platform === 'win'
    ? `powershell -ExecutionPolicy Bypass -File "${path}"`
    : `bash "${path}"`;
}

function buildOurHookNode(matcher: string): HookMatcherNode {
  return {
    matcher,
    hooks: [{ type: 'command', command: buildOurCommand() }],
  };
}

export function isOurHookNode(node: HookMatcherNode): boolean {
  const needle = normalizePath(dispatcherCommandPath(detectPlatform()));
  return node.hooks?.some((h) => normalizePath(h.command).includes(needle)) ?? false;
}

export type ConflictDecision = 'append' | 'skip' | 'abort';

export interface MergeAction {
  action: 'append' | 'replace' | 'skip' | 'remove' | 'noop';
  matcher?: string;
}

export interface MergePlan {
  byEvent: Record<string, MergeAction>;
}

export function mergeHooks(
  hooks: HooksFile,
  enabledEvents: EventName[],
  matchers: Partial<Record<EventName, string>>,
  conflictDecision: ConflictDecision,
): { next: HooksFile; plan: MergePlan } {
  if (conflictDecision === 'abort') {
    return { next: hooks, plan: { byEvent: {} } };
  }

  const nextHooks: NonNullable<HooksFile['hooks']> = { ...(hooks.hooks ?? {}) };
  const next: HooksFile = { ...hooks, hooks: nextHooks };
  const plan: MergePlan = { byEvent: {} };
  const enabledSet = new Set<EventName>(enabledEvents);

  // 1) enabled 이벤트: 머지 (append / replace / skip)
  for (const event of enabledEvents) {
    const matcher = matchers[event] ?? '*';
    const ourNode = buildOurHookNode(matcher);
    const arr = [...(nextHooks[event] ?? [])];
    const ourIdx = arr.findIndex(isOurHookNode);

    if (ourIdx >= 0) {
      arr[ourIdx] = ourNode;
      plan.byEvent[event] = { action: 'replace', matcher };
    } else if (arr.length === 0) {
      arr.push(ourNode);
      plan.byEvent[event] = { action: 'append', matcher };
    } else {
      if (conflictDecision === 'skip') {
        plan.byEvent[event] = { action: 'skip' };
        continue;
      }
      arr.push(ourNode);
      plan.byEvent[event] = { action: 'append', matcher };
    }
    nextHooks[event] = arr;
  }

  // 2) 비활성 이벤트에 우리 hook이 남아 있으면 제거 (정합성 정리)
  for (const event of Object.keys(nextHooks) as EventName[]) {
    if (enabledSet.has(event)) continue;
    const arr = nextHooks[event] ?? [];
    if (!arr.some(isOurHookNode)) continue;
    const filtered = arr.filter((n) => !isOurHookNode(n));
    if (filtered.length === 0) delete nextHooks[event];
    else nextHooks[event] = filtered;
    plan.byEvent[event] = { action: 'remove' };
  }

  return { next, plan };
}

/** uninstall: 우리 hook만 제거. 결과적으로 빈 배열이 된 키는 통째로 삭제. */
export function removeOurHooks(hooks: HooksFile): HooksFile {
  const nextHooks: NonNullable<HooksFile['hooks']> = { ...(hooks.hooks ?? {}) };
  const next: HooksFile = { ...hooks, hooks: nextHooks };

  for (const key of Object.keys(nextHooks) as EventName[]) {
    const filtered = (nextHooks[key] ?? []).filter((n) => !isOurHookNode(n));
    if (filtered.length === 0) delete nextHooks[key];
    else nextHooks[key] = filtered;
  }
  if (Object.keys(nextHooks).length === 0) delete next.hooks;
  return next;
}

export async function writeHooks(hooks: HooksFile): Promise<void> {
  const json = JSON.stringify(hooks, null, 2);
  await writeFile(paths.hooksFile, json + '\n', 'utf8');
}

export async function writeCdaConfig(cfg: CdaConfig): Promise<void> {
  await writeFile(paths.cdaConfig, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
}
