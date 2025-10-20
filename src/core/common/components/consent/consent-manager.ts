// Consent Manager - Handles user consent preferences and analytics enablement
import analytics from '@/core/util/analytics';
import TimeUtil from '@/core/util/time';

export type ConsentPreferences = {
  necessary: boolean; // Always true, can't be disabled
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

export type ConsentDecision = {
  timestamp: string;
  version: string;
  preferences: ConsentPreferences;
};

const CONSENT_STORAGE_KEY = 'user-consent-preferences';
const CONSENT_VERSION = '1.0';

class ConsentManager {
  private listeners: Set<() => void> = new Set();

  /**
   * Check if user has made a consent decision
   */
  public hasConsent(): boolean {
    return localStorage.getItem(CONSENT_STORAGE_KEY) !== null;
  }

  /**
   * Get current consent preferences
   */
  public getPreferences(): ConsentPreferences | null {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return null;

    try {
      const decision: ConsentDecision = JSON.parse(stored);
      return decision.preferences;
    } catch {
      return null;
    }
  }

  /**
   * Get full consent decision including metadata
   */
  public getDecision(): ConsentDecision | null {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  /**
   * Save consent preferences
   */
  public savePreferences(preferences: ConsentPreferences): void {
    const decision: ConsentDecision = {
      timestamp: TimeUtil.nowISO(),
      version: CONSENT_VERSION,
      preferences,
    };

    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(decision));

    // Update analytics based on consent
    this.applyConsent(preferences);

    // Notify listeners
    this.notifyListeners();

    // Track consent decision (if analytics is enabled)
    if (preferences.analytics) {
      analytics.trackEvent('Consent', 'Updated', undefined, undefined, {
        analytics: preferences.analytics,
        marketing: preferences.marketing,
        preferences: preferences.preferences,
      });
    }
  }

  /**
   * Accept all tracking
   */
  public acceptAll(): void {
    this.savePreferences({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    });
  }

  /**
   * Reject all optional tracking (keep only necessary)
   */
  public rejectAll(): void {
    this.savePreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
  }

  /**
   * Clear all consent preferences
   */
  public clearConsent(): void {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    analytics.disable();
    this.notifyListeners();
  }

  /**
   * Apply consent preferences to analytics
   */
  private applyConsent(preferences: ConsentPreferences): void {
    if (preferences.analytics) {
      analytics.enable();
    } else {
      analytics.disable();
    }
  }

  /**
   * Initialize consent on app load
   */
  public initialize(): void {
    const preferences = this.getPreferences();
    if (preferences) {
      this.applyConsent(preferences);
    } else {
      // No consent yet, disable analytics by default
      analytics.disable();
    }
  }

  /**
   * Subscribe to consent changes
   */
  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of consent changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback());
  }

  /**
   * Check if specific consent type is granted
   */
  public hasAnalyticsConsent(): boolean {
    const preferences = this.getPreferences();
    return preferences?.analytics === true;
  }

  public hasMarketingConsent(): boolean {
    const preferences = this.getPreferences();
    return preferences?.marketing === true;
  }

  public hasPreferencesConsent(): boolean {
    const preferences = this.getPreferences();
    return preferences?.preferences === true;
  }
}

// Export singleton instance
export const consentManager = new ConsentManager();
export default consentManager;
