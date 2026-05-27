import * as p from '@clack/prompts';
import type { EventName } from '../settings/types.js';

export async function askMatcher(event: EventName, defaultMatcher: string): Promise<string> {
  const input = await p.text({
    message: `Match pattern (regex) for ${event}`,
    placeholder: defaultMatcher,
    initialValue: defaultMatcher,
  });
  if (p.isCancel(input)) throw new Error('Cancelled');

  const val = String(input).trim() || defaultMatcher;
  if (val === '.*' || val === '*') {
    p.log.warn(`! ${event}: matching all tools — will be very noisy`);
  }
  return val;
}
