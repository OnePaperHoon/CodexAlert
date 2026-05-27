import { readFileSync, existsSync } from 'node:fs';
import { paths } from '../platform/paths.js';
import { ALL_EVENTS, type EventName } from './types.js';

/**
 * ~/.codex/config.toml에서 [[hooks.EventName]] / [hooks.EventName] 섹션 헤더를
 * 단순 라인 스캔으로 추출. TOML 파서를 도입하지 않음 — 우리 용도는 "어떤 이벤트가
 * 등록되어 있는지 감지"뿐이고, inline table 등 변종은 우리 책임 영역 밖.
 */
export function detectTomlHooks(): Set<EventName> {
  const out = new Set<EventName>();
  if (!existsSync(paths.configToml)) return out;
  const raw = readFileSync(paths.configToml, 'utf8');
  const re = /^\s*\[\[?\s*hooks\.([A-Za-z]+)\s*\]?\]/gm;
  const known = new Set<string>(ALL_EVENTS);
  for (const m of raw.matchAll(re)) {
    const name = m[1];
    if (name && known.has(name)) out.add(name as EventName);
  }
  return out;
}
