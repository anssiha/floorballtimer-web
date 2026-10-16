type WakeLockSentinelType = {
  release: () => Promise<void>;
  released?: boolean;
};

let wakeLock: WakeLockSentinelType | null = null;
let isRequested = false;

export async function requestWakeLock(): Promise<boolean> {
  isRequested = true;
  if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
    return false;
  }

  try {
    if (!wakeLock || wakeLock.released) {
      wakeLock = await navigator.wakeLock.request('screen');
      return true;
    }
    return true;
  } catch (err) {
    console.warn('Screen Wake Lock request failed:', err);
    return false;
  }
}

export async function releaseWakeLock(): Promise<void> {
  isRequested = false;
  try {
    if (wakeLock && !wakeLock.released) {
      await wakeLock.release();
    }
  } catch (err) {
    console.warn('Wake Lock release error:', err);
  } finally {
    wakeLock = null;
  }
}

// Automatically re-request wake lock on visibility change if user returns to the tab while timer is running
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && isRequested) {
      await requestWakeLock();
    }
  });
}
