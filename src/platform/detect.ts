export type Platform = 'win' | 'mac';

export function detectPlatform(): Platform {
  if (process.platform === 'win32') return 'win';
  if (process.platform === 'darwin') return 'mac';
  throw new Error(
    `Unsupported platform: ${process.platform}. codex-alert supports Windows and macOS only.`,
  );
}
