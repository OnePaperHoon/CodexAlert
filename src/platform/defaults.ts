import { detectPlatform, type Platform } from './detect.js';

export const DEFAULT_SOUNDS: Record<Platform, string> = {
  win: 'C:/Windows/Media/Speech On.wav',
  mac: '/System/Library/Sounds/Glass.aiff',
};

export function osDefaultSound(): string {
  return DEFAULT_SOUNDS[detectPlatform()];
}
