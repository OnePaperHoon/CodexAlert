import { writeFile } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import * as p from '@clack/prompts';
import { paths } from '../platform/paths.js';

export async function runDisable(): Promise<void> {
  if (!existsSync(paths.codexDir)) mkdirSync(paths.codexDir, { recursive: true });
  await writeFile(paths.disabledFlag, '', 'utf8');
  p.outro('✓ Notifications muted');
}
