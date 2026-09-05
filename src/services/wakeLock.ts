type WakeLockSentinelType = {
  release: () => Promise<void>;
  addEventListener?: (type: string, listener: () => void) => void;
  released?: boolean;
};

let wakeLock: WakeLockSentinelType | null = null;
let isRequested = false;
let onStateChangeCallback: ((active: boolean) => void) | null = null;

export function setWakeLockListener(cb: (active: boolean) => void): () => void {
  onStateChangeCallback = cb;
  cb(wakeLock !== null && !wakeLock.released);
  return () => {
    if (onStateChangeCallback === cb) {
      onStateChangeCallback = null;
    }
  };
}

export async function requestWakeLock(): Promise<boolean> {
  isRequested = true;
  if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
    return false;
  }

  try {
    if (!wakeLock || wakeLock.released) {
      wakeLock = await navigator.wakeLock.request('screen');
      if (wakeLock) {
        wakeLock.addEventListener?.('release', () => {
          if (onStateChangeCallback) onStateChangeCallback(false);
        });
      }
      if (onStateChangeCallback) onStateChangeCallback(true);
      return true;
    }
    return true;
  } catch (err) {
    console.warn('Screen Wake Lock request failed:', err);
    if (onStateChangeCallback) onStateChangeCallback(false);
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
    if (onStateChangeCallback) onStateChangeCallback(false);
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
