/**
 * Feature 2: Invisible Mode Controller
 * Ghost mode — disables all location sharing, community reports,
 * camera registration tied to identity. App becomes a ghost.
 */

export interface InvisibleModeState {
  enabled: boolean;
  locationSharing: boolean;
  communityReports: boolean;
  cameraRegistration: boolean;
  notifications: boolean;
  analytics: boolean;
  activatedAt: string | null;
}

export interface InvisibleModeAction {
  toggle: () => void;
  setEnabled: (enabled: boolean) => void;
  setLocationSharing: (v: boolean) => void;
  setCommunityReports: (v: boolean) => void;
  setCameraRegistration: (v: boolean) => void;
  setNotifications: (v: boolean) => void;
  setAnalytics: (v: boolean) => void;
  reset: () => void;
}

export const INVISIBLE_MODE_DEFAULT: InvisibleModeState = {
  enabled: false,
  locationSharing: true,
  communityReports: true,
  cameraRegistration: true,
  notifications: true,
  analytics: true,
  activatedAt: null,
};

export class InvisibleModeController {
  private state: InvisibleModeState;
  private listeners: Set<(s: InvisibleModeState) => void> = new Set();

  constructor(initial: InvisibleModeState = INVISIBLE_MODE_DEFAULT) {
    this.state = { ...initial };
  }

  getState(): InvisibleModeState {
    return { ...this.state };
  }

  subscribe(fn: (s: InvisibleModeState) => void): () => void {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  }

  private emit(): void {
    const snapshot = this.getState();
    this.listeners.forEach((fn) => fn(snapshot));
  }

  toggle(): void {
    this.setEnabled(!this.state.enabled);
  }

  setEnabled(enabled: boolean): void {
    this.state = {
      ...this.state,
      enabled,
      activatedAt: enabled ? new Date().toISOString() : this.state.activatedAt,
    };
    if (!enabled) {
      // Restore all subsystems when exiting invisible mode
      this.state.locationSharing = true;
      this.state.communityReports = true;
      this.state.cameraRegistration = true;
      this.state.notifications = true;
      this.state.analytics = true;
    }
    this.emit();
  }

  setLocationSharing(v: boolean): void {
    this.state = { ...this.state, locationSharing: v };
    this.emit();
  }

  setCommunityReports(v: boolean): void {
    this.state = { ...this.state, communityReports: v };
    this.emit();
  }

  setCameraRegistration(v: boolean): void {
    this.state = { ...this.state, cameraRegistration: v };
    this.emit();
  }

  setNotifications(v: boolean): void {
    this.state = { ...this.state, notifications: v };
    this.emit();
  }

  setAnalytics(v: boolean): void {
    this.state = { ...this.state, analytics: v };
    this.emit();
  }

  reset(): void {
    this.state = { ...INVISIBLE_MODE_DEFAULT };
    this.emit();
  }
}

/** Singleton controller instance */
export const invisibleMode = new InvisibleModeController();