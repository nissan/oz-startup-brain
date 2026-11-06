const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

/**
 * True only for a whole-second UTC instant written as YYYY-MM-DDTHH:MM:SSZ that names a real
 * calendar time. Date.parse alone is not enough: it rejects some impossible values and silently
 * normalises others (2026-02-30 becomes 2 March), so the value must survive a round trip (R33-03).
 */
export function isUtcInstant(value: unknown): value is string {
  if (typeof value !== 'string' || !INSTANT.test(value)) return false;
  const ms = Date.parse(value);
  return !Number.isNaN(ms) && new Date(ms).toISOString() === `${value.slice(0, 19)}.000Z`;
}

export const UTC_INSTANT_HINT = 'an ISO 8601 UTC instant that exists on the calendar, such as 2026-11-05T00:00:00Z';
