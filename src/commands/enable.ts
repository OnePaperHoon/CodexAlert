import { unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as p from '@clack/prompts';
import { paths } from '../platform/paths.js';

export async function runEnable(): Promise<void> {
  if (existsSync(paths.disabledFlag)) await unlink(paths.disabledFlag);
  p.outro('✓ Notifications unmuted');
}
