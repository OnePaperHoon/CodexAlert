import { unlink, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as p from '@clack/prompts';
import { paths } from '../platform/paths.js';
import { readHooks } from '../settings/reader.js';
import { removeOurHooks, writeHooks, isOurHookNode } from '../settings/writer.js';
import { backupHooks } from '../settings/backup.js';
import { renderRemoveDiff } from '../settings/differ.js';

export async function runUninstall(): Promise<void> {
  p.intro('codex-alert · uninstall');
  const hooks = await readHooks();

  const removedFrom: string[] = [];
  for (const [ev, arr] of Object.entries(hooks.hooks ?? {})) {
    if ((arr ?? []).some(isOurHookNode)) removedFrom.push(ev);
  }
  p.log.message(renderRemoveDiff(removedFrom));

  const alsoDelete = await p.multiselect({
    message: 'Also delete?',
    options: [
      { value: 'scripts', label: '~/.codex/scripts/cda.{ps1,sh}', hint: 'recommended' },
      { value: 'config',  label: '~/.codex/cda-config.json',     hint: 'recommended' },
      { value: 'sounds',  label: '~/.codex/sounds/  (custom sounds)' },
    ],
    initialValues: ['scripts', 'config'],
    required: false,
  });
  if (p.isCancel(alsoDelete)) {
    p.cancel('Aborted');
    return;
  }

  const ok = await p.confirm({ message: 'Apply?', initialValue: true });
  if (p.isCancel(ok) || !ok) {
    p.cancel('Aborted');
    return;
  }

  const backupPath = await backupHooks();
  if (backupPath) p.log.info(`Backed up hooks.json → ${backupPath}`);

  await writeHooks(removeOurHooks(hooks));

  const targets = alsoDelete as string[];
  if (targets.includes('scripts')) {
    for (const f of [paths.scriptPs1, paths.scriptSh]) {
      if (existsSync(f)) await unlink(f);
    }
  }
  if (targets.includes('config') && existsSync(paths.cdaConfig)) {
    await unlink(paths.cdaConfig);
  }
  if (targets.includes('sounds') && existsSync(paths.soundsDir)) {
    await rm(paths.soundsDir, { recursive: true, force: true });
  }

  p.outro('✓ Uninstalled');
}
