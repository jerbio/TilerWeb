// Analytics utility for tracking user interactions
// Supports Google Analytics, Mixpanel, or custom analytics solutions

import TimeUtil from './time';

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

type AnalyticsEvent = {
  category: string;
  action: string;
  label?: string;
  value?: number;
  properties?: AnalyticsProperties;
};

type AnalyticsProvider = 'google' | 'mixpanel' | 'custom' | 'console';

interface WindowWithAnalytics extends Window {
  gtag?: (command: string, ...args: unknown[]) => void;
  mixpanel?: {
    track: (event: string, properties?: AnalyticsProperties) => void;
    identify: (userId: string) => void;
    people: {
      set: (properties: AnalyticsProperties) => void;
    };
  };
}

class Analytics {
  private provider: AnalyticsProvider = 'console';
  private isEnabled: boolean = true;
  private isDebugMode: boolean = false;

  constructor() {
    // Detect provider from environment or window object
    this.initializeProvider();
  }

  private initializeProvider() {
    // Check environment variables for analytics configuration
    const provider = import.meta.env.VITE_ANALYTICS_PROVIDER as AnalyticsProvider;
    if (provider) {
      this.provider = provider;
    }

    // Enable debug mode in development
    this.isDebugMode = import.meta.env.VITE_NODE_ENV === 'development';

    // NOTE: DNT check removed - ensure you have proper consent mechanisms
    // and comply with GDPR, CCPA, and other privacy regulations
  }

  /**
   * Track a page view
   */
  public trackPageView(pageName: string, properties?: AnalyticsProperties) {
    if (!this.isEnabled) return;

    const event = {
      category: 'Page View',
      action: pageName,
      properties,
    };

    this.sendEvent(event);
  }

  /**
   * Track a user interaction/event
   */
  public trackEvent(
    category: string,
    action: string,
    label?: string,
    value?: number,
    properties?: AnalyticsProperties
  ) {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      category,
      action,
      label,
      value,
      properties,
    };

    this.sendEvent(event);
  }

  /**
   * Track button clicks
   */
  public trackButtonClick(buttonName: string, location: string, properties?: AnalyticsProperties) {
    this.trackEvent('Button', 'Click', buttonName, undefined, {
      location,
      ...properties,
    });
  }

  /**
   * Track form submissions
   */
  public trackFormSubmit(formName: string, properties?: AnalyticsProperties) {
    this.trackEvent('Form', 'Submit', formName, undefined, properties);
  }

  /**
   * Track navigation events
   */
  public trackNavigation(destination: string, source: string, properties?: AnalyticsProperties) {
    this.trackEvent('Navigation', 'Navigate', destination, undefined, {
      source,
      ...properties,
    });
  }

  /**
   * Track chat interactions
   */
  public trackChatEvent(action: string, properties?: AnalyticsProperties) {
    this.trackEvent('Chat', action, undefined, undefined, properties);
  }

  /**
   * Track calendar interactions
   */
  public trackCalendarEvent(action: string, properties?: AnalyticsProperties) {
    this.trackEvent('Calendar', action, undefined, undefined, properties);
  }

  /**
   * Track persona interactions
   */
  public trackPersonaEvent(action: string, properties?: AnalyticsProperties) {
    this.trackEvent('Persona', action, undefined, undefined, properties);
  }

  /**
   * Track feature usage
   */
  public trackFeatureUsage(featureName: string, properties?: AnalyticsProperties) {
    this.trackEvent('Feature', 'Use', featureName, undefined, properties);
  }

  /**
   * Track errors
   */
  public trackError(errorMessage: string, properties?: AnalyticsProperties) {
    this.trackEvent('Error', 'Occurred', errorMessage, undefined, properties);
  }

  /**
   * Send event to analytics provider
   */
  private sendEvent(event: AnalyticsEvent) {
    const timestamp = TimeUtil.nowISO();
    const eventData = {
      ...event,
      timestamp,
    };

    // Debug logging
    if (this.isDebugMode) {
      console.log('[Analytics]', eventData);
    }

    switch (this.provider) {
      case 'google':
        this.sendToGoogleAnalytics(event);
        break;
      case 'mixpanel':
        this.sendToMixpanel(event);
        break;
      case 'custom':
        this.sendToCustomAnalytics(event);
        break;
      case 'console':
        // Already logged above
        break;
    }
  }

  private sendToGoogleAnalytics(event: AnalyticsEvent) {
    // Check if gtag is available
    const win = window as unknown as WindowWithAnalytics;
    if (typeof window !== 'undefined' && win.gtag) {
      win.gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.properties,
      });
    }
  }

  private sendToMixpanel(event: AnalyticsEvent) {
    // Check if mixpanel is available
    const win = window as unknown as WindowWithAnalytics;
    if (typeof window !== 'undefined' && win.mixpanel) {
      win.mixpanel.track(`${event.category} - ${event.action}`, {
        label: event.label,
        value: event.value,
        ...event.properties,
      });
    }
  }

  private sendToCustomAnalytics(event: AnalyticsEvent) {
    // Implement custom analytics endpoint
    // Example: POST to your own analytics API
    if (typeof window !== 'undefined' && import.meta.env.VITE_ANALYTICS_ENDPOINT) {
      fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }).catch((error) => {
        console.error('[Analytics] Failed to send event:', error);
      });
    }
  }

  /**
   * Identify a user (for user-specific tracking)
   */
  public identifyUser(userId: string, traits?: AnalyticsProperties) {
    if (!this.isEnabled) return;

    if (this.isDebugMode) {
      console.log('[Analytics] Identify User:', userId, traits);
    }

    const win = window as unknown as WindowWithAnalytics;

    switch (this.provider) {
      case 'google':
        if (typeof window !== 'undefined' && win.gtag) {
          win.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
            user_id: userId,
            ...traits,
          });
        }
        break;
      case 'mixpanel':
        if (typeof window !== 'undefined' && win.mixpanel) {
          win.mixpanel.identify(userId);
          if (traits) {
            win.mixpanel.people.set(traits);
          }
        }
        break;
    }
  }

  /**
   * Disable analytics tracking
   */
  public disable() {
    this.isEnabled = false;
  }

  /**
   * Enable analytics tracking
   */
  public enable() {
    this.isEnabled = true;
  }

  /**
   * Check if analytics is enabled
   */
  public getIsEnabled(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance
export const analytics = new Analytics();
export default analytics;
