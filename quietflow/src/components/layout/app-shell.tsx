'use client';

import { useEffect } from 'react';
import { useStore } from '@/store';
import { cn } from '@/lib/cn';
import { DataSimulator } from './data-simulator';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { LivingMap } from '@/components/map/living-map';
import { CameraGrid } from '@/components/camera/camera-grid';
import { CameraDiscovery } from '@/components/camera/camera-discovery';
import { SecurityPanel } from '@/components/security/security-panel';
import { QuietFinder } from '@/components/quiet-finder/quiet-finder';
import { MyPlaces } from '@/components/business/my-places';
import { Insights } from './insights';
import { SettingsPanel } from './settings-panel';
import { TripPlanner } from '@/components/trip/trip-planner';
import { Community } from '@/components/community/community';
import { HelpPage } from './help-page';
import { WelcomeModal } from './welcome-modal';
import { BusinessDrawer } from '@/components/business/business-drawer';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ToastContainer, showToast } from '@/components/ui/toast';
import { initNotifications, addNotification } from '@/lib/notifications';
import { QuietRoutePanel } from '@/components/camera/quiet-route-panel';
import { RouteGuidancePanel } from '@/components/layout/route-guidance-panel';
import { ScannerPanel } from '@/components/layout/scanner-panel';
import { GodView } from '@/components/layout/god-view';
import { TrafficPanel } from '@/components/layout/traffic-panel';
import { RoutinesPanel } from '@/components/layout/routines-panel';
import { MyCameras } from '@/components/camera/my-cameras';
import { HudStatusBar } from '@/components/layout/hud-status-bar';
import { BootScreen } from '@/components/layout/boot-screen';
import { AppLauncher } from '@/components/layout/app-launcher';
import { NewsAlertsPanel } from '@/components/layout/news-alerts-panel';

const mobileNav = [
  { id: 'hud' as const, label: 'Launcher', icon: '⚡' },
  { id: 'map' as const, label: 'Map', icon: '🗺️' },
  { id: 'cameras' as const, label: 'Cameras', icon: '📹' },
  { id: 'quiet-route' as const, label: 'QuietRoute', icon: '🛡️' },
  { id: 'god-view' as const, label: 'God View', icon: '📡' },
  { id: 'traffic' as const, label: 'Traffic', icon: '🚗' },
  { id: 'news' as const, label: 'News', icon: '📢' },
  { id: 'routines' as const, label: 'Routines', icon: '📅' },
  { id: 'quiet-finder' as const, label: 'Quiet', icon: '🔍' },
  { id: 'my-places' as const, label: 'Places', icon: '❤️' },
  { id: 'trip-planner' as const, label: 'Trip Planner', icon: '🧭' },
  { id: 'community' as const, label: 'Community', icon: '💬' },
  { id: 'insights' as const, label: 'Insights', icon: '📊' },
  { id: 'camera-discovery' as const, label: 'Discover', icon: '🔎' },
  { id: 'security' as const, label: 'LAN Sec', icon: '🛡️' },
  { id: 'my-cameras' as const, label: 'My Cams', icon: '📷' },
];

// Keyboard shortcuts mapped to view IDs
const viewShortcutMap: Record<string, string> = {
  'l': 'hud',
  '1': 'map',
  '2': 'cameras',
  '3': 'quiet-route',
  '4': 'god-view',
  '5': 'quiet-finder',
  '6': 'my-places',
  '7': 'trip-planner',
  '8': 'community',
  '9': 'camera-discovery',
  '0': 'god-view',
  '`': 'traffic',
  'm': 'my-cameras',
  'n': 'news',
  'r': 'routines',
  's': 'settings',
  '?': 'help',
  '/': 'quiet-finder',
  'esc': 'hud',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { settings, activeView, setActiveView, showWelcome } = useStore();

  // Initialize notification system + hydrate persisted state AFTER mount.
  // (Loading localStorage during the first render would make client markup
  // differ from the server/static export and trigger a hydration mismatch.)
  useEffect(() => {
    initNotifications();
    useStore.getState().hydrateFromStorage();
  }, []);

  // Subscribe to density changes for notifications (runs in data simulator updates)
  useEffect(() => {
    const prevLevels = new Map<string, string>();
    const interval = setInterval(() => {
      const { businesses, cameras } = useStore.getState();
      const prefs = useStore.getState().settings;
      if (!prefs.notificationEnabled) return;

      // Check business density changes
      businesses.forEach((b) => {
        if (!b.density?.densityLevel) return;
        const prev = prevLevels.get(`biz-${b.id}`);
        if (prev && prev !== b.density.densityLevel) {
          addNotification({
            type: 'density_alert',
            title: `${b.name} is now ${b.density.densityLevel}`,
            message: `${b.name} busy-ness changed from ${prev} to ${b.density.densityLevel}.`,
            actionable: true,
            actionLabel: 'View',
            locationId: b.id,
            lat: b.lat,
            lng: b.lng,
          });
        }
        prevLevels.set(`biz-${b.id}`, b.density.densityLevel);
      });

      // Check camera status changes
      cameras.forEach((c) => {
        const prev = prevLevels.get(`cam-${c.id}`);
        if (prev && prev !== c.status) {
          addNotification({
            type: 'camera_offline',
            title: `Camera ${c.status}: ${c.name}`,
            message: `Camera ${c.name} is now ${c.status}.`,
            actionable: false,
            locationId: c.id,
          });
        }
        prevLevels.set(`cam-${c.id}`, c.status);
      });
    }, 15000); // Check every 15s

    return () => clearInterval(interval);
  }, []);

  // Request notification permission on first interaction
  useEffect(() => {
    const handler = () => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
      window.removeEventListener('click', handler);
    };
    window.addEventListener('click', handler, { once: true });
    return () => window.removeEventListener('click', handler);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      // Don't trigger when modal dialog is open (welcome modal)
      if (showWelcome) return;

      const key = e.key.toLowerCase();
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Escape always goes to HUD/launcher
      if (e.key === 'Escape') {
        e.preventDefault();
        setActiveView('hud');
        return;
      }

      const view = viewShortcutMap[key];
      if (view) {
        e.preventDefault();
        if (key === '/') {
          // Forward-slash triggers search — already setActiveView to quiet-finder,
          // but we also want to show the search input
          setActiveView(view as typeof activeView);
        } else {
          setActiveView(view as typeof activeView);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveView, showWelcome]);

  return (
    <DataSimulator>
      <div className={cn(
        'flex h-screen w-full overflow-hidden bg-[var(--background)] text-[var(--foreground)]',
        settings.anxietyFriendlyUI && 'calm-mode',
        settings.reduceAnimations && 'reduce-motion',
        settings.largeText && 'text-lg',
        settings.highContrast && 'high-contrast',
        settings.theme === 'cyberpunk' && 'dark cyberpunk',
        settings.theme === 'zen' && 'dark zen',
        settings.theme === 'dark' && 'dark',
      )}>
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Mobile bottom nav */}
        <div className="mobile-nav fixed bottom-0 left-0 right-0 z-50 flex items-stretch gap-1 overflow-x-auto overscroll-x-contain border-t px-2 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur-md snap-x snap-mandatory md:hidden">
          {mobileNav.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                'mobile-nav-item flex min-w-[5.75rem] flex-none snap-start flex-col items-center justify-center gap-1 rounded-xl px-3 py-2.5 text-[10px] font-medium leading-none',
                activeView === item.id ? 'mobile-nav-active' : ''
              )}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
          <Header />
          <HudStatusBar />
          <div className="relative flex-1 overflow-y-auto overflow-x-hidden">
            <ErrorBoundary>
              <LivingMap />
            </ErrorBoundary>
            {/* AppLauncher overlays the map when active */}
            <AppLauncher />
            <ErrorBoundary>
              <CameraGrid />
            </ErrorBoundary>
            <ErrorBoundary>
              <CameraDiscovery />
            </ErrorBoundary>
            <ErrorBoundary>
              <QuietFinder />
            </ErrorBoundary>
            <ErrorBoundary>
              <MyPlaces />
            </ErrorBoundary>
            <ErrorBoundary>
              <Insights />
            </ErrorBoundary>
            <ErrorBoundary>
              <SettingsPanel />
            </ErrorBoundary>
            <ErrorBoundary>
              <TripPlanner />
            </ErrorBoundary>
            <ErrorBoundary>
              <Community />
            </ErrorBoundary>
            <ErrorBoundary>
              <HelpPage />
            </ErrorBoundary>
            <ErrorBoundary>
              <QuietRoutePanel />
            </ErrorBoundary>
            <ErrorBoundary>
              <ScannerPanel />
            </ErrorBoundary>
            <ErrorBoundary>
              <GodView />
            </ErrorBoundary>
            <ErrorBoundary>
              <SecurityPanel />
            </ErrorBoundary>
            <ErrorBoundary>
              <TrafficPanel />
            </ErrorBoundary>
            <ErrorBoundary>
              <RoutinesPanel />
            </ErrorBoundary>
            <ErrorBoundary>
              <MyCameras />
            </ErrorBoundary>
            <ErrorBoundary>
              <NewsAlertsPanel />
            </ErrorBoundary>
            <ErrorBoundary>
              <BusinessDrawer />
            </ErrorBoundary>
            {children}
          </div>
        </div>

        <WelcomeModal />
        <ToastContainer />
      </div>

      {/* Cyberpunk scanlines + vignette overlays (layer outside the main container for full-screen effect) */}
      {settings.theme === 'cyberpunk' && (
        <><div className="scanlines" /><div className="vignette" /><BootScreen /></>
      )}
    </DataSimulator>
  );
}
