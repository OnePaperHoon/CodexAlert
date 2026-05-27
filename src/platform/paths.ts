import { homedir } from 'node:os';
import { join } from 'node:path';

const HOME = homedir();
const CODEX_DIR = join(HOME, '.codex');

export const paths = {
  home: HOME,
  codexDir: CODEX_DIR,
  hooksFile: join(CODEX_DIR, 'hooks.json'),
  configToml: join(CODEX_DIR, 'config.toml'),
  cdaConfig: join(CODEX_DIR, 'cda-config.json'),
  disabledFlag: join(CODEX_DIR, 'notifications.disabled'),
  scriptsDir: join(CODEX_DIR, 'scripts'),
  scriptPs1: join(CODEX_DIR, 'scripts', 'cda.ps1'),
  scriptSh: join(CODEX_DIR, 'scripts', 'cda.sh'),
  soundsDir: join(CODEX_DIR, 'sounds'),
  backupsDir: join(CODEX_DIR, 'cda-backups'),
};

/**
 * platform별 dispatcher 경로 (always forward slash).
 * hooks.json의 command 필드에 박을 때 사용.
 */
export function dispatcherCommandPath(platform: 'win' | 'mac'): string {
  const p = platform === 'win' ? paths.scriptPs1 : paths.scriptSh;
  return p.replace(/\\/g, '/');
}

/**
 * 명령 문자열 또는 경로의 정규화.
 * - 백슬래시 → 슬래시
 * - 큰/작은따옴표 제거 (인용된 경로와 raw 경로를 같게 봄)
 * - 트림 + 소문자
 * 사용처: isOurHookNode가 hooks.json command 안의 dispatcher 경로를 찾을 때.
 */
export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/["']/g, '').trim().toLowerCase();
}
