# Cookie Consent Integration Guide

This guide explains how to integrate the cookie consent system into your application.

## Quick Start

### 1. Wrap your app with ConsentProvider

In your main `App.tsx` or root component:

```typescript
import { ConsentProvider } from '@/core/common/components/consent';

function App() {
  return (
    <ConsentProvider>
      {/* Your app components */}
      <YourAppContent />
    </ConsentProvider>
  );
}

export default App;
```

That's it! The consent banner will automatically show to users who haven't made a choice yet.

## Components

### ConsentProvider

The main provider that manages consent state and displays the banner/modal.

**Props:**

- `children` - Your app components

**Usage:**

```typescript
<ConsentProvider>
  <App />
</ConsentProvider>
```

### CookieConsentBanner

The bottom banner that appears when users first visit. Automatically shown by `ConsentProvider`.

**Features:**

- Accept All / Reject All buttons
- Customize button to open settings
- Auto-dismisses after user makes a choice
- Mobile responsive

### PrivacySettingsModal

Detailed privacy settings modal with toggles for each consent type. Automatically shown by `ConsentProvider`.

**Consent Types:**

- **Necessary** - Always enabled, cannot be disabled
- **Analytics** - Website analytics and tracking
- **Marketing** - Marketing and advertising cookies
- **Preferences** - User preference storage

### PrivacySettingsButton

A styled button component for your settings page.

**Usage:**

```typescript
import { PrivacySettingsButton } from '@/core/common/components/consent';

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <PrivacySettingsButton />
    </div>
  );
}
```

## Using the Consent Hook

Access consent state and methods anywhere in your app:

```typescript
import { useConsent } from '@/core/common/components/consent';

function MyComponent() {
  const {
    preferences,
    hasConsent,
    openSettings,
    acceptAll,
    rejectAll,
    savePreferences,
  } = useConsent();

  // Check if user has made a choice
  if (!hasConsent) {
    return <div>Waiting for consent...</div>;
  }

  // Check specific consent
  if (preferences?.analytics) {
    // Track something
  }

  return (
    <button onClick={openSettings}>
      Manage Privacy Settings
    </button>
  );
}
```

## Direct Consent Manager Usage

For non-React contexts or advanced usage:

```typescript
import { consentManager } from '@/core/common/components/consent';

// Check if user has consented
if (consentManager.hasConsent()) {
	// User has made a choice
}

// Get current preferences
const preferences = consentManager.getPreferences();

// Check specific consent
if (consentManager.hasAnalyticsConsent()) {
	// Track analytics
}

// Save preferences
consentManager.savePreferences({
	necessary: true,
	analytics: true,
	marketing: false,
	preferences: true,
});

// Accept/Reject all
consentManager.acceptAll();
consentManager.rejectAll();

// Subscribe to changes
const unsubscribe = consentManager.subscribe(() => {
	console.log('Consent preferences changed');
});
```

## Analytics Integration

The consent system automatically enables/disables analytics based on user preferences:

```typescript
// In consent-manager.ts
private applyConsent(preferences: ConsentPreferences): void {
  if (preferences.analytics) {
    analytics.enable();
  } else {
    analytics.disable();
  }
}
```

When a user grants analytics consent:

- `analytics.enable()` is called
- All subsequent analytics events will be tracked

When a user denies analytics consent:

- `analytics.disable()` is called
- No analytics events will be sent

## Customization

### Changing Consent Types

Edit `ConsentPreferences` in `consent-manager.ts`:

```typescript
export type ConsentPreferences = {
	necessary: boolean;
	analytics: boolean;
	marketing: boolean;
	preferences: boolean;
	// Add your custom types here
};
```

Then update the modal in `privacy-settings-modal.tsx` to include UI for your new types.

### Styling

All components use styled-components and the app's palette. To customize:

```typescript
// In any consent component
const CustomBanner = styled(BannerContainer)`
	// Your custom styles
	background: linear-gradient(...);
`;
```

### Banner Text

Edit the text in `cookie-consent-banner.tsx`:

```typescript
<p>
  We use cookies... {/* Your custom text */}
</p>
```

### Modal Content

Edit descriptions in `privacy-settings-modal.tsx`:

```typescript
<ConsentDescription>
  Your custom description for analytics cookies...
</ConsentDescription>
```

## Storage

Consent preferences are stored in `localStorage`:

```typescript
const CONSENT_STORAGE_KEY = 'user-consent-preferences';
```

Stored format:

```json
{
	"timestamp": "2025-01-17T12:00:00.000Z",
	"version": "1.0",
	"preferences": {
		"necessary": true,
		"analytics": true,
		"marketing": false,
		"preferences": true
	}
}
```

## Testing

### Test the Banner

1. Clear localStorage: `localStorage.removeItem('user-consent-preferences')`
2. Refresh page
3. Banner should appear

### Test the Modal

1. Click "Customize" on the banner
2. Toggle consent options
3. Click "Save Settings"
4. Verify in localStorage

### Test Analytics Integration

1. Reject all cookies
2. Check console - no analytics events should appear
3. Accept all cookies
4. Interact with the app
5. Analytics events should appear in console

## Privacy Policy Integration

Update your privacy policy page to explain:

1. **What cookies you use**
    - Necessary: Session management, security
    - Analytics: Google Analytics, usage tracking
    - Marketing: Ad tracking (if applicable)
    - Preferences: Language, theme settings

2. **How users can control cookies**
    - Through the consent banner
    - Through privacy settings
    - By contacting support

3. **Data retention**
    - How long you keep data
    - How to request deletion

4. **Third-party services**
    - Google Analytics
    - Any other tracking services

## GDPR/CCPA Compliance

The consent system helps with compliance by:

✅ **Opt-in by default** - Analytics disabled until user consents
✅ **Clear information** - Explains what each consent type does  
✅ **Easy opt-out** - Users can change preferences anytime  
✅ **Granular control** - Users can accept/reject specific categories  
✅ **Persistent choice** - Consent decision is remembered  
✅ **Transparent** - Shows what's enabled in settings

**Still required:**

- Privacy policy page
- Data processing agreements
- Data deletion procedures
- Cookie policy document

## Troubleshooting

### Banner not showing

- Check if consent is already saved in localStorage
- Clear localStorage and refresh
- Verify ConsentProvider wraps your app

### Analytics still disabled after accepting

- Check browser console for errors
- Verify analytics.ts is imported correctly
- Check environment variables are set

### Modal won't open

- Verify ConsentProvider is in your component tree
- Check for React context errors
- Ensure useConsent() is called within ConsentProvider

### Preferences not saving

- Check browser localStorage is enabled
- Check for localStorage quota errors
- Verify consentManager.savePreferences() is called

## Best Practices

1. **Show banner early** - Don't wait for user interaction
2. **Make it dismissible** - Let users close without choosing
3. **Be transparent** - Clearly explain what you track
4. **Respect choices** - Honor DNT if you add it back
5. **Test thoroughly** - Verify on different devices/browsers
6. **Update privacy policy** - Keep it current with your practices
7. **Log consent changes** - Track when users change preferences (if allowed)

## Examples

### Adding to Navigation Footer

```typescript
import { PrivacySettingsButton } from '@/core/common/components/consent';

function Footer() {
  return (
    <footer>
      <nav>
        <a href="/privacy">Privacy Policy</a>
        <PrivacySettingsButton />
      </nav>
    </footer>
  );
}
```

### Conditional Feature Rendering

```typescript
import { useConsent } from '@/core/common/components/consent';

function MarketingWidget() {
  const { preferences } = useConsent();

  if (!preferences?.marketing) {
    return null; // Don't show marketing content
  }

  return <AdBanner />;
}
```

### Manual Consent Trigger

```typescript
function CustomButton() {
  const { openSettings } = useConsent();

  return (
    <button onClick={openSettings}>
      🍪 Cookie Settings
    </button>
  );
}
```

---

## Summary

The consent system provides:

- ✅ GDPR/CCPA-friendly consent collection
- ✅ Beautiful, mobile-responsive UI
- ✅ Automatic analytics integration
- ✅ React hooks for easy integration
- ✅ Persistent consent storage
- ✅ Granular consent control

Your users can now control their privacy preferences, and you're compliant with privacy regulations! 🎉
