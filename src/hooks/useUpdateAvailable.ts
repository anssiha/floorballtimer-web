import { useState, useEffect } from 'react';

/**
 * True once a newer version of the app has been installed by the service worker.
 * The new worker takes over by itself (skipWaiting + clients.claim), but the page keeps
 * running the old code until it is reloaded, so the user decides when to do that.
 */
export function useUpdateAvailable(): boolean {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
    const container = navigator.serviceWorker;

    // The very first install also fires controllerchange (clients.claim) when the page had
    // no worker yet; that is not an update, so only a change from one worker to another counts.
    let controller = container.controller;
    const onControllerChange = () => {
      const hadController = controller !== null;
      controller = container.controller;
      if (hadController) setUpdateAvailable(true);
    };
    container.addEventListener('controllerchange', onControllerChange);

    // A phone app can stay suspended for days without a navigation, so the browser would not
    // look for a new version; check whenever the app comes back to the foreground.
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      container
        .getRegistration(import.meta.env.BASE_URL)
        .then((registration) => registration?.update())
        .catch(() => {
          // Offline: nothing to check
        });
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      container.removeEventListener('controllerchange', onControllerChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return updateAvailable;
}
