import * as p from '@clack/prompts';
import { existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { basename, extname, isAbsolute, resolve, join } from 'node:path';
import { paths } from '../platform/paths.js';
import { detectPlatform } from '../platform/detect.js';
import { osDefaultSound } from '../platform/defaults.js';

const ALLOWED_WIN = new Set(['.wav']);
const ALLOWED_MAC = new Set(['.wav', '.aiff', '.aif', '.mp3', '.m4a', '.caf']);

/** "default" 또는 ~/.codex/sounds/<basename> 로 복사된 사운드 파일명 반환 */
export async function chooseSound(eventLabel: string): Promise<string> {
  const choice = await p.select({
    message: `Sound for ${eventLabel}`,
    options: [
      { value: 'default', label: 'Default (OS built-in)' },
      { value: 'custom',  label: 'Custom file...' },
    ],
    initialValue: 'default',
  });
  if (p.isCancel(choice) || choice === 'default') return 'default';

  const platform = detectPlatform();
  const allowed = platform === 'win' ? ALLOWED_WIN : ALLOWED_MAC;
  const osDefault = osDefaultSound();

  for (;;) {
    const inputRaw = await p.text({
      message: `Path to sound file (${[...allowed].join('/')}). Empty = OS default`,
      placeholder: osDefault,
    });
    if (p.isCancel(inputRaw)) return 'default';
    const input = String(inputRaw).trim();
    if (!input) return 'default';

    const abs = isAbsolute(input) ? input : resolve(process.cwd(), input);
    if (!existsSync(abs)) {
      p.log.error('File not found, try again');
      continue;
    }
    const ext = extname(abs).toLowerCase();
    if (!allowed.has(ext)) {
      p.log.error(`Extension ${ext} not allowed`);
      continue;
    }
    mkdirSync(paths.soundsDir, { recursive: true });
    const fname = basename(abs);
    copyFileSync(abs, join(paths.soundsDir, fname));
    return fname;
  }
}
