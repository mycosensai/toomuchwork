// ─── Search & Destination Types ───────────────────────────────

export interface SearchResult {
  id: string;
  name: string;
  lat: number;
  lng: number;
  kind: 'business' | 'camera' | 'saved_place' | 'address';
  category?: string;
  densityLevel?: string;
  distance?: number; // meters from user
  address?: string;
  isOpen?: boolean;
}

export interface SearchFilters {
  kinds: Array<'business' | 'camera' | 'saved_place' | 'address'>;
  categories: string[];
  maxDistance: number; // meters, 0 = unlimited
  onlyOpen: boolean;
  onlyFavorites: boolean;
}

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  kinds: ['business', 'camera', 'saved_place'],
  categories: [],
  maxDistance: 0,
  onlyOpen: false,
  onlyFavorites: false,
};

export const BUSINESS_CATEGORIES = [
  'grocery',
  'pharmacy',
  'coffee',
  'bank',
  'post_office',
  'library',
  'park',
  'restaurant',
  'retail',
  'other',
] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  grocery: '🛒',
  pharmacy: '💊',
  coffee: '☕',
  bank: '🏦',
  post_office: '📬',
  library: '📚',
  park: '🌳',
  restaurant: '🍽️',
  retail: '🛍️',
  other: '📍',
};

// ─── Notification Types ───────────────────────────────────────

export type NotificationType =
  | 'density_alert'      // business/camera busy-ness changed
  | 'quiet_window'       // quiet period starting
  | 'camera_offline'     // favorite camera went offline
  | 'route_update'       // traffic on planned route
  | 'parking_full'       // parking lot near capacity
  | 'weather_alert'      // severe weather
  | 'general';           // miscellaneous

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionable: boolean;
  actionLabel?: string;
  actionPayload?: Record<string, unknown>;
  locationId?: string;
  lat?: number;
  lng?: number;
  ttl?: number; // seconds before auto-dismiss
}

export interface NotificationPreferences {
  enabled: boolean;
  densityAlerts: boolean;
  quietWindows: boolean;
  cameraOffline: boolean;
  routeUpdates: boolean;
  parkingFull: boolean;
  weatherAlerts: boolean;
  quietHoursStart: number; // hour 0-23
  quietHoursEnd: number;
  vibrate: boolean;
  sound: boolean;
  maxPerHour: number;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: false,
  densityAlerts: true,
  quietWindows: true,
  cameraOffline: true,
  routeUpdates: false,
  parkingFull: true,
  weatherAlerts: true,
  quietHoursStart: 22,
  quietHoursEnd: 8,
  vibrate: true,
  sound: false,
  maxPerHour: 10,
};
