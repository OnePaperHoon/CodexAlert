import { existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import pc from 'picocolors';
import { paths } from '../platform/paths.js';
import { readHooks, readCdaConfig } from '../settings/reader.js';
import { isOurHookNode } from '../settings/writer.js';
import { ALL_EVENTS } from '../settings/types.js';
import { detectTomlHooks } from '../settings/config-toml.js';

function tilde(p: string): string {
  return p.startsWith(paths.home) ? '~' + p.slice(paths.home.length).replace(/\\/g, '/') : p;
}

export async function runStatus(): Promise<void> {
  const installed = existsSync(paths.scriptPs1) || existsSync(paths.scriptSh);
  const cfg = await readCdaConfig();
  const hooks = await readHooks();
  const disabled = existsSync(paths.disabledFlag);
  const tomlHooks = detectTomlHooks();

  console.log();
  console.log(pc.bold('codex-alert · status'));
  console.log();

  if (!installed) {
    console.log(pc.dim('  Not installed. Run `cda init`.'));
    console.log();
    return;
  }

  console.log(`  ${pc.green('●')} Installed`);
  console.log(`  Dispatcher: ${tilde(paths.scriptsDir)}/cda.{ps1,sh}`);
  if (cfg) console.log(`  Config:     ${tilde(paths.cdaConfig)}  (locale: ${cfg.locale})`);
  console.log();

  console.log(pc.bold('  Hooks:'));
  let hasAny = false;
  for (const ev of ALL_EVENTS) {
    const arr = hooks.hooks?.[ev] ?? [];
    const oursNodes = arr.filter(isOurHookNode);
    const others = arr.length - oursNodes.length;
    if (oursNodes.length === 0 && others === 0) continue;
    hasAny = true;

    const cdaEnabled = cfg?.events?.[ev]?.enabled ?? false;
    const status = oursNodes.length > 0
      ? (cdaEnabled ? pc.green('✓') : pc.yellow('!'))
      : ' ';

    const sources: string[] = [];
    if (oursNodes.length > 0) sources.push(pc.cyan(`cda×${oursNodes.length}`));
    if (others > 0) sources.push(pc.dim(`user×${others}`));

    let detail = '';
    if (oursNodes.length > 0 && cfg?.events?.[ev]) {
      const e = cfg.events[ev];
      const matcher = oursNodes[0]?.matcher ?? '*';
      detail = pc.dim(`  | matcher=${matcher}, sound=${e.sound}, msg=${JSON.stringify(e.message)}`);
    }

    console.log(`    ${status}  ${ev.padEnd(18)} ${sources.join(' + ')}${detail}`);
  }
  if (!hasAny) console.log(pc.dim('    (none)'));

  // 정합성 경고
  const mismatches: string[] = [];
  for (const ev of ALL_EVENTS) {
    const ours = (hooks.hooks?.[ev] ?? []).some(isOurHookNode);
    const enabledInCfg = cfg?.events?.[ev]?.enabled ?? false;
    if (ours && !enabledInCfg) mismatches.push(ev);
  }
  if (mismatches.length > 0) {
    console.log();
    console.log(pc.yellow(`  ! Mismatch: hooks.json present but cda-config disabled: ${mismatches.join(', ')}`));
    console.log(pc.dim('    → run `cda init` to reconcile'));
  }

  // config.toml 충돌 안내
  if (tomlHooks.size > 0) {
    console.log();
    console.log(pc.yellow(`  ! ~/.codex/config.toml has hooks for: ${[...tomlHooks].join(', ')}`));
    console.log(pc.dim('    Codex will run both yours and these concurrently.'));
  }

  console.log();
  console.log(`  Mute flag:  ${disabled ? pc.yellow('on (notifications muted)') : pc.dim('off')}`);

  if (existsSync(paths.backupsDir)) {
    const files = readdirSync(paths.backupsDir)
      .filter((f) => f.startsWith('hooks.') && f.endsWith('.json'))
      .map((f) => ({ name: f, mtime: statSync(join(paths.backupsDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    if (files.length > 0 && files[0]) {
      const latest = new Date(files[0].mtime).toLocaleString();
      console.log(`  Backups:    ${files.length} (latest ${latest})`);
    }
  }

  console.log();
  console.log(pc.dim("  If hooks aren't firing, run /hooks in codex to trust them."));
  console.log();
}
