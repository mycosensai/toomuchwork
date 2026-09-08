/**
 * Feature 5: No-Human-Interaction Mode
 * All features reachable via keyboard/voice/gesture.
 * Zero required taps on other people's content.
 */

export interface NoHumanInteractionConfig {
  enabled: boolean;
  keyboardOnly: boolean;       // navigate via keyboard only
  voiceCommands: boolean;      // voice navigation enabled
  gestureMode: boolean;        // swipe/gesture navigation
  hideSocialElements: boolean; // hide like/comment/share buttons
  skipCommunityFeed: boolean;  // don't show community feed
  soloNavigation: boolean;     // solo-only routing, no carpool
}

const DEFAULT_CONFIG: NoHumanInteractionConfig = {
  enabled: false,
  keyboardOnly: true,
  voiceCommands: true,
  gestureMode: true,
  hideSocialElements: true,
  skipCommunityFeed: false,
  soloNavigation: true,
};

export class NoHumanInteractionMode {
  private config: NoHumanInteractionConfig;
  private listeners: Set<(c: NoHumanInteractionConfig) => void> = new Set();

  constructor(initial: Partial<NoHumanInteractionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...initial };
  }

  getConfig(): NoHumanInteractionConfig {
    return { ...this.config };
  }

  subscribe(fn: (c: NoHumanInteractionConfig) => void): () => void {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  }

  private emit(): void {
    const snapshot = this.getConfig();
    this.listeners.forEach((fn) => fn(snapshot));
  }

  toggle(): void {
    this.setEnabled(!this.config.enabled);
  }

  setEnabled(enabled: boolean): void {
    this.config = { ...this.config, enabled };
    if (enabled) {
      this.config.keyboardOnly = true;
      this.config.voiceCommands = true;
      this.config.hideSocialElements = true;
    }
    this.emit();
  }

  setKeyboardOnly(v: boolean): void {
    this.config = { ...this.config, keyboardOnly: v };
    this.emit();
  }

  setVoiceCommands(v: boolean): void {
    this.config = { ...this.config, voiceCommands: v };
    this.emit();
  }

  setGestureMode(v: boolean): void {
    this.config = { ...this.config, gestureMode: v };
    this.emit();
  }

  setHideSocialElements(v: boolean): void {
    this.config = { ...this.config, hideSocialElements: v };
    this.emit();
  }

  setSkipCommunityFeed(v: boolean): void {
    this.config = { ...this.config, skipCommunityFeed: v };
    this.emit();
  }

  setSoloNavigation(v: boolean): void {
    this.config = { ...this.config, soloNavigation: v };
    this.emit();
  }

  reset(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.emit();
  }
}

export const noHumanInteraction = new NoHumanInteractionMode();