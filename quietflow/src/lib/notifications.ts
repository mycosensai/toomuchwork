'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AppNotification,
  NotificationType,
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/types/features';

const NOTIFICATION_STORAGE_KEY = 'quietflow-notifications';
const PREF_STORAGE_KEY = 'quietflow-notification-preferences';
const MAX_STORED_NOTIFICATIONS = 100;
const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hour

// ─── In-memory notification store (subscription-based) ───

type Listener = (notifications: AppNotification[]) => void;

let notificationsState: AppNotification[] = [];
let preferencesState: NotificationPreferences = { ...DEFAULT_NOTIFICATION_PREFERENCES };
const listeners: Set<Listener> = new Set();
let rateLimitCount = 0;
let rateLimitResetAt = Date.now() + RATE_LIMIT_WINDOW_MS;

function loadPersisted(): void {
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (raw) notificationsState = JSON.parse(raw);
    const prefRaw = localStorage.getItem(PREF_STORAGE_KEY);
    if (prefRaw) preferencesState = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(prefRaw) };
  } catch { /* ignore */ }
}

function persist(): void {
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notificationsState));
    localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(preferencesState));
  } catch { /* ignore */ }
}

function notifyListeners(): void {
  const snapshot = [...notificationsState];
  listeners.forEach((fn) => fn(snapshot));
}

// ─── Public API ───

export function initNotifications(): void {
  loadPersisted();
  notifyListeners();
}

export function getNotifications(): AppNotification[] {
  return [...notificationsState];
}

export function getUnreadCount(): number {
  return notificationsState.filter((n) => !n.read).length;
}

export function getPreferences(): NotificationPreferences {
  return { ...preferencesState };
}

export function updatePreferences(prefs: Partial<NotificationPreferences>): void {
  preferencesState = { ...preferencesState, ...prefs };
  persist();
  notifyListeners();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener([...notificationsState]);
  return () => { listeners.delete(listener); };
}

// ─── Rate limiting ───

function checkRateLimit(): boolean {
  const now = Date.now();
  if (now > rateLimitResetAt) {
    rateLimitCount = 0;
    rateLimitResetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  rateLimitCount++;
  return rateLimitCount <= preferencesState.maxPerHour;
}

// ─── Add notification ───

export function addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification | null {
  if (!preferencesState.enabled) return null;

  // Check quiet hours
  const now = new Date();
  const hour = now.getHours();
  if (preferencesState.quietHoursStart > preferencesState.quietHoursEnd) {
    // spans midnight
    if (hour >= preferencesState.quietHoursStart || hour < preferencesState.quietHoursEnd) return null;
  } else {
    if (hour >= preferencesState.quietHoursStart && hour < preferencesState.quietHoursEnd) return null;
  }

  // Type-specific opt-out
  const typePrefMap: Record<NotificationType, keyof NotificationPreferences> = {
    density_alert: 'densityAlerts',
    quiet_window: 'quietWindows',
    camera_offline: 'cameraOffline',
    route_update: 'routeUpdates',
    parking_full: 'parkingFull',
    weather_alert: 'weatherAlerts',
    general: 'densityAlerts',
  };
  const prefKey = typePrefMap[notif.type];
  if (prefKey && !preferencesState[prefKey]) return null;

  // Rate limit
  if (!checkRateLimit()) return null;

  const entry: AppNotification = {
    ...notif,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    read: false,
  };

  notificationsState = [entry, ...notificationsState].slice(0, MAX_STORED_NOTIFICATIONS);
  persist();
  notifyListeners();

  // Try native Notification API (browser push)
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(notif.title, { body: notif.message, silent: !preferencesState.sound });
    } catch { /* ignore */ }
  }

  return entry;
}

export function markAsRead(id: string): void {
  notificationsState = notificationsState.map((n) => n.id === id ? { ...n, read: true } : n);
  persist();
  notifyListeners();
}

export function markAllAsRead(): void {
  notificationsState = notificationsState.map((n) => ({ ...n, read: true }));
  persist();
  notifyListeners();
}

export function clearNotifications(): void {
  notificationsState = [];
  persist();
  notifyListeners();
}

export function dismissNotification(id: string): void {
  notificationsState = notificationsState.filter((n) => n.id !== id);
  persist();
  notifyListeners();
}

// ─── Conditional notification helpers ───

export function notifyDensityChange(
  name: string,
  level: string,
  locationId: string,
  lat: number,
  lng: number,
): void {
  addNotification({
    type: 'density_alert',
    title: `${name} is now ${level}`,
    message: `Traffic/density level changed at ${name}.`,
    actionable: true,
    actionLabel: 'View',
    locationId,
    lat,
    lng,
  });
}

export function notifyQuietWindow(name: string, locationId: string, lat: number, lng: number): void {
  addNotification({
    type: 'quiet_window',
    title: `Quiet time at ${name}`,
    message: `${name} should be less busy now — a good time to visit.`,
    actionable: true,
    actionLabel: 'Navigate',
    locationId,
    lat,
    lng,
  });
}

export function notifyCameraOffline(name: string, locationId?: string): void {
  addNotification({
    type: 'camera_offline',
    title: `Camera offline: ${name}`,
    message: `Camera ${name} is no longer streaming.`,
    actionable: false,
    locationId,
  });
}

export function notifyParkingFull(name: string, occupancyRate: number, locationId: string): void {
  addNotification({
    type: 'parking_full',
    title: `Parking almost full at ${name}`,
    message: `${name} parking is at ${Math.round(occupancyRate * 100)}% capacity.`,
    actionable: true,
    actionLabel: 'Find alternate',
    locationId,
  });
}

// ─── React hook ───

export function useNotifications(): {
  notifications: AppNotification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  updatePrefs: (p: Partial<NotificationPreferences>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
  dismiss: (id: string) => void;
} {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences>(getPreferences());

  useEffect(() => {
    const unsub = subscribe((n) => {
      setNotifications(n);
      setUnreadCount(n.filter((x) => !x.read).length);
      setPreferences({ ...preferencesState });
    });
    return unsub;
  }, []);

  return {
    notifications,
    unreadCount,
    preferences,
    updatePrefs: updatePreferences,
    markRead: markAsRead,
    markAllRead: markAllAsRead,
    clear: clearNotifications,
    dismiss: dismissNotification,
  };
}
