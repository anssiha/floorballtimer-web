export function triggerPeriodEndVibration(): void {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate([500, 250, 500]);
    }
  } catch (err) {
    console.warn('Vibration API error:', err);
  }
}

export function triggerButtonHaptic(): void {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
  } catch {
    // Ignore silent fallback
  }
}
