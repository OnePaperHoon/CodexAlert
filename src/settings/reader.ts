import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { paths } from '../platform/paths.js';
import type { HooksFile, CdaConfig } from './types.js';

export async function readHooks(): Promise<HooksFile> {
  if (!existsSync(paths.hooksFile)) return {};
  const raw = await readFile(paths.hooksFile, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      `hooks.json is not valid JSON at ${paths.hooksFile}. Fix it manually first.`,
    );
  }
}

export async function readCdaConfig(): Promise<CdaConfig | null> {
  if (!existsSync(paths.cdaConfig)) return null;
  const raw = await readFile(paths.cdaConfig, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
