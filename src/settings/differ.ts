import pc from 'picocolors';
import type { MergePlan } from './writer.js';

export function renderMergeDiff(plan: MergePlan): string {
  const lines: string[] = ['  ~ Diff to apply ~'];
  const cmd = '~/.codex/scripts/cda.{ps1,sh}';
  for (const [event, info] of Object.entries(plan.byEvent)) {
    const matcherStr = info.matcher && info.matcher !== '*'
      ? `, matcher: ${info.matcher}` : '';
    if (info.action === 'append') {
      lines.push(pc.green(`  + hooks.${event}[] += { dispatcher: ${cmd}${matcherStr} }`));
    } else if (info.action === 'replace') {
      lines.push(pc.yellow(`  ~ hooks.${event}[i]  = { dispatcher: ${cmd}${matcherStr} }   (update)`));
    } else if (info.action === 'skip') {
      lines.push(pc.dim(`  · hooks.${event} skipped (existing kept)`));
    } else if (info.action === 'remove') {
      lines.push(pc.red(`  - hooks.${event}[]  (our entry removed — no longer enabled)`));
    }
  }
  if (lines.length === 1) lines.push(pc.dim('  (no changes)'));
  return lines.join('\n');
}

export function renderRemoveDiff(eventsRemoved: string[]): string {
  if (eventsRemoved.length === 0) {
    return pc.dim('  (no codex-alert hooks found)');
  }
  return [
    '  ~ Diff to apply ~',
    ...eventsRemoved.map((e) => pc.red(`  - hooks.${e}[]  (our entry)`)),
  ].join('\n');
}
