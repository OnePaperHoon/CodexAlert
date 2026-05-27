import * as p from '@clack/prompts';
import type { HooksFile, EventName } from '../settings/types.js';
import { isOurHookNode, type ConflictDecision } from '../settings/writer.js';

/** 우리 hook이 아닌 다른 hook 충돌 이벤트들 검출 */
export function detectConflicts(
  hooks: HooksFile,
  events: EventName[],
): EventName[] {
  const out: EventName[] = [];
  for (const ev of events) {
    const arr = hooks.hooks?.[ev] ?? [];
    if (arr.length > 0 && !arr.every(isOurHookNode)) out.push(ev);
  }
  return out;
}

export async function askConflict(conflicts: EventName[]): Promise<ConflictDecision> {
  p.log.warn(`Existing hooks detected for: ${conflicts.join(', ')}`);
  const res = await p.select({
    message: 'How should we handle the conflicts?',
    options: [
      { value: 'append', label: 'Append after existing  (both fire — may notify twice)' },
      { value: 'skip',   label: 'Skip   (keep existing, do nothing for these events)' },
      { value: 'abort',  label: 'Abort  (no changes at all)' },
    ],
    initialValue: 'append',
  });
  if (p.isCancel(res)) return 'abort';
  return res as ConflictDecision;
}
