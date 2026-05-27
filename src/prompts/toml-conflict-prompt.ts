import * as p from '@clack/prompts';
import type { EventName } from '../settings/types.js';

/**
 * config.toml에 같은 이벤트의 hook이 등록되어 있을 때 경고만 출력하고 진행.
 * 우리는 config.toml을 수정하지 않으므로 충돌을 해소할 책임도 없다 — 두 파일의
 * hook이 concurrent 실행됨을 사용자에게 알리고 confirm을 받는다.
 */
export async function warnTomlConflicts(crossing: EventName[]): Promise<void> {
  if (crossing.length === 0) return;
  p.log.warn(
    `! Detected hooks in ~/.codex/config.toml: ${crossing.join(', ')}\n` +
    `  Your hook will fire alongside these (both will run concurrently).`,
  );
  const ok = await p.confirm({
    message: 'Proceed anyway?',
    initialValue: true,
  });
  if (p.isCancel(ok) || !ok) throw new Error('Aborted by user');
}
