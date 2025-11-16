import { useEffect, useState } from 'react';

interface PWABannerProps {
  onClose?: () => void;
}

export function PWAInstallBanner({ onClose }: PWABannerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ User installed the PWA');
    }

    setShowInstall(false);
    setDeferredPrompt(null);
    onClose?.();
  };

  const handleDismiss = () => {
    setShowInstall(false);
    onClose?.();
  };

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="rounded-lg border bg-white dark:bg-gray-800 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Install App</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Install this app for quick access and offline use
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export function PWAUpdateBanner() {
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateSW, setUpdateSW] = useState<(() => void) | null>(null);

  useEffect(() => {
    const registerSW = async () => {
      try {
        const { registerSW } = await import('virtual:pwa-register');
        
        const updateServiceWorker = registerSW({
          onRegistered(r) {
            console.log('✅ SW Registered:', r);
          },
          onRegisterError(error) {
            console.log('❌ SW registration error:', error);
          },
          onOfflineReady() {
            setOfflineReady(true);
          },
          onNeedRefresh() {
            setNeedRefresh(true);
          },
        });

        setUpdateSW(() => updateServiceWorker);
      } catch (error) {
        console.log('PWA not available:', error);
      }
    };

    registerSW();
  }, []);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  const handleUpdate = () => {
    if (updateSW) {
      updateSW();
    }
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="rounded-lg border bg-white dark:bg-gray-800 p-4 shadow-lg min-w-[320px]">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium">
              {offlineReady
                ? '✅ App ready to work offline'
                : '🔄 New update available'}
            </p>
          </div>
          <div className="flex gap-2">
            {needRefresh && (
              <button
                onClick={handleUpdate}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700"
              >
                Reload
              </button>
            )}
            <button
              onClick={close}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 text-sm z-50">
      ⚠️ You're offline - Some features may be limited
    </div>
  );
}