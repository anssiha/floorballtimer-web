/**
 * Format milliseconds into MM:SS
 * When counting down, Math.ceil is used so 00:00 only appears upon complete expiration.
 * When counting up, Math.floor is used so 00:00 represents the first second (0.000s to 0.999s).
 */
export function formatMMSS(
  ms: number,
  countDirection: 'UP' | 'DOWN' = 'DOWN'
): { minutes: string; seconds: string; formatted: string } {
  const safeMs = Math.max(0, ms);
  const totalSeconds =
    countDirection === 'UP' ? Math.floor(safeMs / 1000) : Math.ceil(safeMs / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  const minutesStr = String(mins).padStart(2, '0');
  const secondsStr = String(secs).padStart(2, '0');

  return {
    minutes: minutesStr,
    seconds: secondsStr,
    formatted: `${minutesStr}:${secondsStr}`,
  };
}

/**
 * Format milliseconds into tenths for overtime/final seconds if desired
 */
export function formatMMSSTenths(ms: number): string {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const tenths = Math.floor((safeMs % 1000) / 100);

  const minsStr = String(mins).padStart(2, '0');
  const secsStr = String(secs).padStart(2, '0');

  return `${minsStr}:${secsStr}.${tenths}`;
}
