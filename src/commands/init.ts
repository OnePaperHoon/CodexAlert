import { mkdir, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { paths } from '../platform/paths.js';
import { readHooks, readCdaConfig } from '../settings/reader.js';
import {
  mergeHooks, writeHooks, writeCdaConfig, type ConflictDecision,
} from '../settings/writer.js';
import { backupHooks } from '../settings/backup.js';
import { renderMergeDiff } from '../settings/differ.js';
import { detectTomlHooks } from '../settings/config-toml.js';
import { selectEvents } from '../prompts/event-select.js';
import { detectConflicts, askConflict } from '../prompts/conflict-prompt.js';
import { warnTomlConflicts } from '../prompts/toml-conflict-prompt.js';
import { buildConfig } from '../prompts/config-flow.js';

export async function runInit(): Promise<void> {
  p.intro('codex-alert · init');

  if (!existsSync(paths.codexDir)) {
    await mkdir(paths.codexDir, { recursive: true });
    p.log.warn(`Created ${paths.codexDir}. Is Codex CLI installed?`);
  }

  const hooks = await readHooks();
  const previous = await readCdaConfig();
  const tomlHooks = detectTomlHooks();

  // 1) 이벤트 선택 (+ matcher 입력)
  const { events: enabled, matchers } = await selectEvents(previous);

  // 2) config.toml 충돌 경고
  const crossing = enabled.filter((e) => tomlHooks.has(e));
  await warnTomlConflicts(crossing);

  // 3) hooks.json 내부 충돌 검사
  const conflicts = detectConflicts(hooks, enabled);
  let decision: ConflictDecision = 'append';
  if (conflicts.length > 0) {
    decision = await askConflict(conflicts);
    if (decision === 'abort') {
      p.cancel('Aborted by user');
      return;
    }
  }

  // 4) merge plan 미리 산출 → diff
  const { next, plan } = mergeHooks(hooks, enabled, matchers, decision);
  p.log.message(renderMergeDiff(plan));

  // 'skip' 으로 결정된 이벤트는 hooks.json 에 안 들어가므로
  // cda-config 에서도 비활성 처리 + advanced prompt 에서 제외
  const skipped = new Set(
    Object.entries(plan.byEvent)
      .filter(([, a]) => a.action === 'skip')
      .map(([ev]) => ev),
  );
  const effectiveEnabled = enabled.filter((e) => !skipped.has(e));

  // 5) config 흐름
  const cfg = await buildConfig(effectiveEnabled, previous);

  // 6) 최종 confirm
  const ok = await p.confirm({ message: 'Apply changes?', initialValue: true });
  if (p.isCancel(ok) || !ok) {
    p.cancel('Aborted');
    return;
  }

  // 7) 백업 + hooks.json 쓰기
  const backupPath = await backupHooks();
  if (backupPath) p.log.info(`Backed up hooks.json → ${backupPath}`);
  await writeHooks(next);

  // 8) dispatcher 스크립트 복사
  await mkdir(paths.scriptsDir, { recursive: true });
  const pkgScriptsDir = locatePackageScripts();
  await copyFile(join(pkgScriptsDir, 'cda.ps1'), paths.scriptPs1);
  await copyFile(join(pkgScriptsDir, 'cda.sh'), paths.scriptSh);

  // 9) cda-config.json 쓰기
  await writeCdaConfig(cfg);

  p.outro('✓ Installed');

  // 10) /hooks trust 안내
  console.log();
  console.log(pc.bold('Next step: trust the hook in Codex.'));
  console.log('  1. Launch codex CLI');
  console.log('  2. Run  /hooks');
  console.log('  3. Find the cda hook and choose "trust"');
  console.log();
  console.log(pc.dim('Until trusted, the hook will not fire.'));
  console.log();
}

/** 빌드된 dist/cli.js 위치 → ../scripts */
function locatePackageScripts(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, '..', 'scripts');
}
