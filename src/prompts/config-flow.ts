import * as p from '@clack/prompts';
import { chooseSound } from './sound-prompt.js';
import { DEFAULT_SOUNDS } from '../platform/defaults.js';
import { DEFAULT_MESSAGES, type Locale } from '../i18n/messages.js';
import {
  ALL_EVENTS,
  type CdaConfig, type CdaEventConfig, type EventName,
} from '../settings/types.js';

function defaultEventCfg(ev: EventName, enabled: boolean, locale: Locale): CdaEventConfig {
  return {
    enabled,
    sound: 'default',
    message: DEFAULT_MESSAGES[locale][ev],
  };
}

export async function buildConfig(
  enabled: EventName[],
  previous: CdaConfig | null,
): Promise<CdaConfig> {
  const localeChoice = await p.select({
    message: 'Default message language',
    options: [
      { value: 'en', label: 'English' },
      { value: 'ko', label: '한국어' },
    ],
    initialValue: previous?.locale ?? 'en',
  });
  if (p.isCancel(localeChoice)) throw new Error('Cancelled');
  const locale = localeChoice as Locale;

  const useDefaults = await p.confirm({
    message: 'Use default sound + message?',
    initialValue: true,
  });
  if (p.isCancel(useDefaults)) throw new Error('Cancelled');

  const events = {} as Record<EventName, CdaEventConfig>;

  for (const ev of ALL_EVENTS) {
    const isEnabled = enabled.includes(ev);

    if (!isEnabled) {
      const base = previous?.events?.[ev] ?? defaultEventCfg(ev, false, locale);
      events[ev] = { ...base, enabled: false };
      continue;
    }

    if (useDefaults) {
      events[ev] = {
        enabled: true,
        sound: previous?.events?.[ev]?.sound ?? 'default',
        message: DEFAULT_MESSAGES[locale][ev],
      };
      continue;
    }

    const sound = await chooseSound(ev);
    const initialMsg = previous?.events?.[ev]?.message ?? DEFAULT_MESSAGES[locale][ev];
    const msgInput = await p.text({
      message: `Message for ${ev}`,
      initialValue: initialMsg,
    });
    if (p.isCancel(msgInput)) throw new Error('Cancelled');
    events[ev] = {
      enabled: true,
      sound,
      message: String(msgInput),
    };
  }

  return {
    version: 1,
    locale,
    events,
    defaults: {
      sound_win: DEFAULT_SOUNDS.win,
      sound_mac: DEFAULT_SOUNDS.mac,
    },
  };
}
