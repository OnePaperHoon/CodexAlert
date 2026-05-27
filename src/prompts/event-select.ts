import * as p from '@clack/prompts';
import {
  BASIC_EVENTS, ADVANCED_EVENTS, DEFAULT_ENABLED, DEFAULT_MATCHERS,
  type CdaConfig, type EventName,
} from '../settings/types.js';
import { askMatcher } from './matcher-prompt.js';

export interface EventSelection {
  events: EventName[];
  /** Advanced 이벤트만 키로 들어감. Basic은 항상 "*"이라 외부에서 default 처리 */
  matchers: Partial<Record<EventName, string>>;
}

export async function selectEvents(previous: CdaConfig | null): Promise<EventSelection> {
  const prevEnabled = previous
    ? (Object.entries(previous.events ?? {})
        .filter(([, c]) => c?.enabled)
        .map(([k]) => k as EventName))
    : [];

  const basicDefaults = prevEnabled.filter((e): e is typeof BASIC_EVENTS[number] =>
    (BASIC_EVENTS as readonly string[]).includes(e),
  );
  const advDefaults = prevEnabled.filter((e): e is typeof ADVANCED_EVENTS[number] =>
    (ADVANCED_EVENTS as readonly string[]).includes(e),
  );

  const basic = await p.multiselect({
    message: 'Basic events',
    options: BASIC_EVENTS.map((e) => ({ value: e, label: e })),
    initialValues: basicDefaults.length > 0 ? basicDefaults : DEFAULT_ENABLED,
    required: false,
  });
  if (p.isCancel(basic)) throw new Error('Cancelled');

  const wantAdv = await p.confirm({
    message: 'Show advanced (noisy) events?',
    initialValue: advDefaults.length > 0,
  });
  if (p.isCancel(wantAdv)) throw new Error('Cancelled');

  let advanced: EventName[] = [];
  const matchers: Partial<Record<EventName, string>> = {};
  if (wantAdv) {
    const adv = await p.multiselect({
      message: 'Advanced events (noisy)',
      options: ADVANCED_EVENTS.map((e) => ({ value: e, label: `${e}  ! noisy` })),
      initialValues: advDefaults,
      required: false,
    });
    if (p.isCancel(adv)) throw new Error('Cancelled');
    advanced = adv as EventName[];

    for (const ev of advanced) {
      const def = DEFAULT_MATCHERS[ev] ?? '*';
      matchers[ev] = await askMatcher(ev, def);
    }
  }

  return { events: [...(basic as EventName[]), ...advanced], matchers };
}
