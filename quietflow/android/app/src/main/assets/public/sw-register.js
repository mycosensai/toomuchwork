// Registers the QuietFlow service worker (PWA install + offline shell + push notifications).
// Only in real browsers — NOT inside the Capacitor Android WebView, where
// service workers are unsupported and can hang/crash app boot.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const isCapacitor = Boolean(window.Capacitor) || /Capacitor/.test(navigator.userAgent);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', registration.scope);

      // Listen for messages from service worker (notification clicks)
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'NOTIFICATION_CLICKED') {
          // Focus the app or navigate to relevant page
          window.focus();
        }
      });
    } catch (err) {
      console.warn('SW registration failed:', err);
    }
  };

  if (!isCapacitor) {
    if (document.readyState === 'complete') {
      void registerServiceWorker();
    } else {
      window.addEventListener('load', registerServiceWorker, { once: true });
    }
  }
}
