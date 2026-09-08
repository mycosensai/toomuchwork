/**
 * Feature 9: DnD Schedule
 * Set hours when app goes fully dark/ghost.
 * No notifications, no alerts, no pings. Pure silence.
 */

export interface DNDSchedule {
  enabled: boolean;
  startHour: number;   // 0-23
  endHour: number;     // 0-23
  days: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  quietModeOnly: boolean; // if true, only mutes alerts; if false, fully dark
  autoRespond: boolean;   // auto-reply to messages during DnD
  autoReplyText: string;
}

const DEFAULT_DND: DNDSchedule = {
  enabled: false,
  startHour: 22,
  endHour: 7,
  days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  quietModeOnly: false,
  autoRespond: false,
  autoReplyText: 'I\'m in quiet mode. I\'ll respond when I\'m available.',
};

export class DNDScheduleController {
  private state: DNDSchedule;
  private listeners: Set<(s: DNDSchedule) => void> = new Set();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(initial: Partial<DNDSchedule> = {}) {
    this.state = { ...DEFAULT_DND, ...initial };
  }

  getState(): DNDSchedule {
    return { ...this.state };
  }

  subscribe(fn: (s: DNDSchedule) => void): () => void {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  }

  private emit(): void {
    this.listeners.forEach((fn) => fn(this.getState()));
  }

  setEnabled(v: boolean): void {
    this.state = { ...this.state, enabled: v };
    this.emit();
  }

  setStartHour(h: number): void {
    this.state = { ...this.state, startHour: Math.max(0, Math.min(23, h)) };
    this.emit();
  }

  setEndHour(h: number): void {
    this.state = { ...this.state, endHour: Math.max(0, Math.min(23, h)) };
    this.emit();
  }

  setDays(days: DNDSchedule['days']): void {
    this.state = { ...this.state, days };
    this.emit();
  }

  setQuietModeOnly(v: boolean): void {
    this.state = { ...this.state, quietModeOnly: v };
    this.emit();
  }

  setAutoRespond(v: boolean): void {
    this.state = { ...this.state, autoRespond: v };
    this.emit();
  }

  setAutoReplyText(text: string): void {
    this.state = { ...this.state, autoReplyText: text };
    this.emit();
  }

  /**
   * Check if DnD is currently active.
   */
  isActive(): boolean {
    if (!this.state.enabled) return false;
    const now = new Date();
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
    const today = dayNames[now.getDay()];

    if (!this.state.days.includes(today)) return false;

    const hour = now.getHours();
    const { startHour, endHour } = this.state;

    if (startHour < endHour) {
      return hour >= startHour && hour < endHour;
    }
    // Overnight schedule (e.g., 22:00 - 07:00)
    return hour >= startHour || hour < endHour;
  }

  reset(): void {
    this.state = { ...DEFAULT_DND };
    this.emit();
  }
}

export const dndSchedule = new DNDScheduleController();