'use client';

import { useNotifications } from '@/lib/notifications';
import { cn } from '@/lib/cn';
import { AppNotification } from '@/types/features';
import { useState } from 'react';

interface NotificationPanelProps {
  className?: string;
  onClose?: () => void;
}

const NOTIFICATION_ICONS: Record<string, string> = {
  density_alert: '🔴',
  quiet_window: '🌿',
  camera_offline: '📹',
  route_update: '🗺️',
  parking_full: '🅿️',
  weather_alert: '🌩️',
  general: '💬',
};

export function NotificationPanel({ className, onClose }: NotificationPanelProps) {
  const { notifications, unreadCount, preferences, updatePrefs, markRead, markAllRead, clear } = useNotifications();
  const [showSettings, setShowSettings] = useState(false);

  const groupedByDate = groupNotifications(notifications);

  return (
    <div className={cn(
      'flex flex-col bg-white dark:bg-zinc-950',
      'fixed inset-0 z-50 md:relative md:inset-auto md:max-h-[80vh] md:w-96 md:rounded-xl md:border md:border-zinc-200 md:shadow-xl dark:md:border-zinc-800',
      className,
    )}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔔</span>
          <h2 className="font-semibold text-zinc-800 dark:text-zinc-100">Notifications</h2>
          {unreadCount > 0 && (
            <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              'rounded p-1.5 text-xs transition-colors',
              showSettings ? 'bg-emerald-100 text-emerald-600' : 'text-zinc-400 hover:text-zinc-600',
            )}
            aria-label="Notification settings"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="rounded px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20">
              Mark all read
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" aria-label="Close">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Preferences</h3>
          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm text-zinc-700 dark:text-zinc-300">
              <span>Enable notifications</span>
              <input type="checkbox" checked={preferences.enabled} onChange={(e) => updatePrefs({ enabled: e.target.checked })} className="rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500" />
            </label>
            {preferences.enabled && (
              <>
                {([
                  ['densityAlerts', 'Density alerts'],
                  ['quietWindows', 'Quiet window alerts'],
                  ['cameraOffline', 'Camera offline alerts'],
                  ['parkingFull', 'Parking full alerts'],
                  ['weatherAlerts', 'Weather alerts'],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between pl-4 text-xs text-zinc-600 dark:text-zinc-400">
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={preferences[key] as boolean}
                      onChange={(e) => updatePrefs({ [key]: e.target.checked })}
                      className="rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500"
                    />
                  </label>
                ))}
                <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <span>Vibrate</span>
                  <input type="checkbox" checked={preferences.vibrate} onChange={(e) => updatePrefs({ vibrate: e.target.checked })} className="rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500" />
                  <span>Sound</span>
                  <input type="checkbox" checked={preferences.sound} onChange={(e) => updatePrefs({ sound: e.target.checked })} className="rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500" />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <span className="mb-3 text-4xl">🔔</span>
          <p className="text-sm font-medium text-zinc-500">No notifications yet</p>
          <p className="mt-1 text-xs text-zinc-400">
            Enable notifications in settings to get density alerts, quiet window updates, and more.
          </p>
        </div>
      ) : (
        <div className="flex-1 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">
          {Object.entries(groupedByDate).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <div className="sticky top-0 bg-white/95 px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400 backdrop-blur-sm dark:bg-zinc-950/95">
                {dateLabel}
              </div>
              {items.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'flex gap-3 px-4 py-3 transition-colors',
                    !n.read && 'bg-emerald-50/50 dark:bg-emerald-900/10',
                  )}
                  onClick={() => markRead(n.id)}
                >
                  <span className="mt-0.5 text-lg">{NOTIFICATION_ICONS[n.type] || '💬'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm', !n.read ? 'font-semibold text-zinc-800 dark:text-zinc-100' : 'font-normal text-zinc-600 dark:text-zinc-400')}>
                        {n.title}
                      </p>
                      <span className="flex-shrink-0 text-[10px] text-zinc-400">
                        {formatRelativeTime(n.timestamp)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">{n.message}</p>
                    {n.actionable && n.actionLabel && (
                      <button className="mt-1.5 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {n.actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-zinc-200 px-4 py-2 dark:border-zinc-800">
          <button onClick={clear} className="text-xs text-red-500 hover:text-red-600">
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ───

function groupNotifications(notifications: AppNotification[]): Record<string, AppNotification[]> {
  const groups: Record<string, AppNotification[]> = {};
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();

  notifications.forEach((n) => {
    const d = new Date(n.timestamp);
    const dateStr = d.toDateString() === today ? 'Today' : d.toDateString() === yesterday ? 'Yesterday' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(n);
  });

  return groups;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
