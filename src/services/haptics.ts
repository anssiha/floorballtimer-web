let hapticsEnabled = true;

export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
}

export function triggerPeriodEndVibration(): void {
  if (!hapticsEnabled) return;
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate([500, 250, 500]);
    }
  } catch (err) {
    console.warn('Vibration API error:', err);
  }
}

export function triggerButtonHaptic(): void {
  if (!hapticsEnabled) return;
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
  } catch {
    // Ignore silent fallback
  }
}
