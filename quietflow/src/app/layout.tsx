import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';
import { RouteCameraCounter } from '@/components/camera/route-camera-counter';

export const metadata: Metadata = {
  title: 'QuietFlow — Live Traffic Intelligence',
  description: 'Know when it\'s quiet outside. Real-time traffic density, live cameras, and personalized quiet-window finder for stress-free errands.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'QuietFlow',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffd700',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full overflow-hidden bg-zinc-50 dark:bg-zinc-900 cyberpunk-safe-area">
        <AppShell>
          <RouteCameraCounter />
          {children}
        </AppShell>
        <script src="/sw-register.js" async />
      </body>
    </html>
  );
}
