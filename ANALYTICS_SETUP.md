# Analytics Implementation Guide

This document describes the analytics tracking implementation added to the TilerWeb application.

## Overview

Analytics tracking has been added to major UI components to monitor user interactions and behavior. The implementation is flexible and supports multiple analytics providers including:

- **Google Analytics** (gtag.js)
- **Mixpanel**
- **Custom Analytics API**
- **Console logging** (for development)

## Analytics Utility

The analytics utility is located at `src/core/util/analytics.ts`. It provides a singleton instance that can be imported and used throughout the application.

### Basic Usage

```typescript
import analytics from '@/core/util/analytics';

// Track a custom event
analytics.trackEvent('Category', 'Action', 'Label', value, { customProp: 'value' });

// Track specific interactions
analytics.trackButtonClick('Button Name', 'Location');
analytics.trackPageView('Page Name');
analytics.trackFormSubmit('Form Name');
```

### Configuration

Set up your analytics provider using environment variables:

```env
# Analytics Provider (google, mixpanel, custom, console)
VITE_ANALYTICS_PROVIDER=google

# Google Analytics Measurement ID
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Custom Analytics Endpoint (if using custom provider)
VITE_ANALYTICS_ENDPOINT=https://your-analytics-api.com/events
```

## Tracked Components

### 1. Calendar Component (`calendar.tsx`)

**Events Tracked:**

- `Calendar View Loaded` - When the calendar component mounts
    - Properties: `daysInView`, `startDate`
- `Navigate Days` - When user navigates between days
    - Properties: `direction`, `daysChanged`, `newStartDate`

### 1b. Calendar Events Component (`calendar_events.tsx`)

**Events Tracked:**

- `Event Selected` - When user clicks on a calendar event/tile
    - Properties: `eventId`, `eventName`, `isRigid`, `isTardy`, `hasLocation`, `duration`, `startTime`
- `Travel Detail Clicked` - When user clicks on a travel detail (transit between events)
    - Properties: `travelMedium`, `duration`, `hasStartLocation`, `hasEndLocation`

### 2. Chat Component (`chat.tsx`)

**Events Tracked:**

- `Chat Opened` - When chat component mounts
    - Properties: `personaId`, `hasExistingSession`
- `Message Sent` - When user sends a chat message
    - Properties: `messageLength`, `hasContext`, `personaId`
- `Accept Changes` - When user accepts proposed changes
    - Properties: `requestId`, `personaId`
- `New Chat Started` - When user starts a new chat session
    - Properties: `personaId`, `previousSessionId`
- `Context Removed` - When user removes a context item
    - Properties: `contextName`, `contextEntityId`, `personaId`
- **Error Events:**
    - `Chat Limit Reached`
    - `Chat Message Send Failed`

### 3. Navigation Component (`navigation.tsx`)

**Events Tracked:**

- `Try Free` button click
    - Properties: `isModalOpen`, `isOnHomePage`

### 4. Waitlist Form (`WaitlistForm.tsx`)

**Events Tracked:**

- `Waitlist Form Step` - Progress through form steps
    - Properties: `step`, `stepName`
- `Waitlist Form` - Final form submission
    - Properties: `profession`, `integrationsCount`, `hasUseCase`
- **Error Events:**
    - `Waitlist Signup Failed`

### 5. Persona Card Expanded (`persona_card_expanded.tsx`)

**Events Tracked:**

- `Persona Card Expanded` - When a persona card is expanded
    - Properties: `personaId`, `personaName`, `hasExistingUser`
- `Persona Card Collapsed` - When a persona card is collapsed
    - Properties: `personaId`, `personaName`
- `Mobile Chat Closed` - When mobile chat overlay is closed
    - Properties: `personaId`

## Event Categories

The analytics system organizes events into the following categories:

1. **Page View** - Page navigation events
2. **Button** - Button click interactions
3. **Form** - Form submissions and interactions
4. **Navigation** - Site navigation events
5. **Chat** - Chat-related interactions
6. **Calendar** - Calendar view and navigation
7. **Persona** - Persona selection and interaction
8. **Feature** - Feature usage tracking
9. **Error** - Error occurrences

## Privacy Considerations

### Do Not Track (DNT)

The analytics utility respects the browser's Do Not Track (DNT) setting. If DNT is enabled, no analytics events will be sent.

### User Identification

The system supports user identification for logged-in users:

```typescript
analytics.identifyUser(userId, {
	email: 'user@example.com',
	name: 'User Name',
	plan: 'premium',
});
```

### Disable Analytics

Users can disable analytics programmatically:

```typescript
analytics.disable();
```

## Development Mode

In development mode (`VITE_NODE_ENV=development`):

- All events are logged to the console
- Events are still sent to configured providers
- Debug information is more verbose

## Adding New Analytics Events

To add analytics to a new component:

1. Import the analytics utility:

```typescript
import analytics from '@/core/util/analytics';
```

2. Track events at appropriate points:

```typescript
const handleAction = () => {
	analytics.trackEvent('Category', 'Action', 'Label', undefined, {
		customProperty: 'value',
	});

	// Your action logic...
};
```

3. Use specialized tracking methods when available:

```typescript
// For button clicks
analytics.trackButtonClick('Download', 'Hero Section');

// For form submissions
analytics.trackFormSubmit('Contact Form', { source: 'footer' });

// For feature usage
analytics.trackFeatureUsage('Dark Mode', { enabled: true });
```

## Best Practices

1. **Consistent Naming**: Use clear, consistent names for events and properties
2. **Meaningful Properties**: Include contextual information that helps with analysis
3. **Avoid PII**: Don't track personally identifiable information without consent
4. **Test in Development**: Verify events in console before deploying
5. **Document Events**: Keep this document updated with new events

## Testing

To test analytics in development:

1. Set `VITE_ANALYTICS_PROVIDER=console` in your `.env` file
2. Open browser console
3. Interact with tracked components
4. Verify events are logged with correct properties

## Troubleshooting

### Events not appearing in analytics provider

1. Check environment variables are set correctly
2. Verify analytics provider script is loaded (for Google Analytics/Mixpanel)
3. Check browser console for errors
4. Ensure Do Not Track is not enabled in browser

### Events showing but with incorrect data

1. Check the event properties being passed
2. Verify the analytics utility is imported correctly
3. Review console logs in development mode

## Future Enhancements

Potential improvements to the analytics system:

- [ ] Add user journey tracking
- [ ] Implement funnel analysis
- [ ] Add A/B testing support
- [ ] Create analytics dashboard
- [ ] Add performance metrics tracking
- [ ] Implement session recording integration
- [ ] Add conversion tracking
- [ ] Support for multiple analytics providers simultaneously

## Support

For questions or issues with the analytics implementation, refer to:

- Analytics utility: `src/core/util/analytics.ts`
- This documentation
- Your analytics provider's documentation
