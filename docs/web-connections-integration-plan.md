# Web Connections Integration Plan

## 1. Purpose

This document defines the architecture, backend contract, user experience, test strategy, observability, implementation tracker, and feedback loop for adding calendar connections to the Tiler web application.

The web experience should provide the same core capability as the Flutter mobile application while using browser-appropriate routing, OAuth, responsive layout, and cookie-based authentication.

This is a TDD plan. Each phase begins with a failing test, implements the smallest behavior needed to pass, then refactors only after the focused tests are green.

## 2. Scope

### In scope for v1

- Google Calendar connection.
- Protected Connections page under Settings.
- OAuth initiation through the existing server-owned `Account/ExternalLogin` flow.
- Server-managed Google OAuth scopes and credential exchange.
- Connected account display.
- Multiple returned integration records if the backend supports them.
- Disconnect with confirmation.
- Integration location search and selection.
- Calendar item selection with a local draft and explicit batch Save.
- Nested integration detail route that survives refresh and supports deep links.
- Loading, empty, error, success, cancellation, and retry states.
- Localization, analytics, error logging, and user feedback instrumentation.
- Responsive web-native presentation consistent with the existing dark Settings experience.

### Out of scope for v1

- Microsoft Calendar implementation.
- Apple Calendar implementation.
- Slack or Google Tasks implementation.
- Browser-side Google client secrets.
- Browser storage of Google access or refresh tokens.
- A new saved-location management feature.
- Native mobile code changes.
- Replacing the mobile integration architecture.

## 3. Current Architecture

### Web application

The relevant web surfaces are:

- `src/pages/settings/SettingsLayout.tsx`
    - Renders the Settings index.
    - Currently includes Account, Tile Preferences, and Notification Preferences.
    - Already has a Connections translation entry available in the locale files.
- `src/App.tsx`
    - Owns protected route registration.
    - Settings pages are nested below `SettingsLayout`.
- `src/core/constants/routes.ts`
    - Central route registry.
- `src/api/appApi.ts`
    - Shared JSON request wrapper.
    - Sends `credentials: 'include'` for ASP.NET authentication cookies.
    - Handles the existing `{ Error, Content }` response shape.
- `src/api/locationApi.ts`
    - Existing location lookup and search API wrapper.
- `src/services/scheduleService.ts`
    - Existing service boundary for location search and lookup.
- `src/core/common/components/side-panel/edit-calendar-event/EditCalendarEvent.tsx`
    - Existing debounced location search and select behavior to reuse as a design and interaction reference.
- `src/pages/UserAuthentication.tsx`
    - Existing Google sign-in form posts to `Account/ExternalLogin`.
    - This is an identity sign-in surface today, so calendar-linking behavior must be verified rather than assumed.
- `src/services/locationService.ts`
    - Existing browser/current-location behavior. It should not be used to silently overwrite an explicitly selected integration location.

### Mobile application

The relevant Flutter surfaces are:

- `lib/routes/authenticatedUser/settings/integration/connetions.dart`
    - Provider chooser.
- `lib/routes/authenticatedUser/settings/integration/integrationWidgetRoute.dart`
    - Connected integration list, add, disconnect, location navigation, and detail navigation.
- `lib/routes/authenticatedUser/settings/integration/calendarItemsRoute.dart`
    - Calendar item selection UI.
- `lib/routes/authenticatedUser/settings/integration/bloc/integrations_bloc.dart`
    - Integration state transitions and mutation orchestration.
- `lib/routes/authenticatedUser/settings/integration/bloc/integrations_event.dart`
    - Get, add, delete, location update, and calendar item update events.
- `lib/routes/authenticatedUser/settings/integration/bloc/integrations_state.dart`
    - Initial, loading, loaded, deleted, added, and error states.
- `lib/services/api/integrationsApi.dart`
    - Integration API calls.
- `lib/services/api/authorization.dart`
    - Google calendar OAuth code handoff.
- `lib/data/calendarIntegration.dart`
    - Integration and calendar item models.

## 4. Functional Flow

### 4.1 Open Connections

1. The authenticated user opens Settings.
2. Settings displays a Connections row.
3. The user navigates to `/settings/connections`.
4. The page fetches `GET api/integrations`.
5. The page renders loading, empty, error, or connected states.

### 4.2 Connect Google Calendar

1. The user selects Add for Google Calendar.
2. The browser submits the server-owned `Account/ExternalLogin` flow.
3. The server requests the configured Google Calendar scopes.
4. Google authenticates and asks for consent when necessary.
5. Google redirects to the server callback.
6. The server exchanges the authorization response and persists the provider credentials.
7. The server preserves the Tiler authentication session.
8. The server redirects the browser to the Connections page with a short-lived result.
9. The Connections page reads the result, shows feedback, removes transient query parameters, and refreshes `GET api/integrations`.

The web must not implement the mobile native `serverAuthCode` exchange. The shared security invariant is that provider credentials are exchanged and stored by the server.

### 4.3 Manage a connected integration

1. The user opens `/settings/connections/:integrationId`.
2. The page displays the provider, account identity, current integration location, and calendar items.
3. The user searches for and selects a location.
4. The selected location is held in the local draft until Save.
5. The user changes calendar selections locally.
6. The page displays the number of selected calendars.
7. Save submits the changed location and calendar settings using the confirmed backend contract.
8. On success, the page refreshes the integration and clears the draft.
9. On failure, the draft remains available and the user receives an actionable error.

### 4.4 Disconnect

1. The user selects Disconnect.
2. The page presents a confirmation dialog naming the account where practical.
3. Confirm submits the delete request.
4. On success, the integration is removed from local display and the list is refreshed.
5. On failure, the integration remains visible and the user can retry.

## 5. Confirmed API Contracts

These contracts are observed in the mobile implementation and must be verified against the backend before web coding begins.

### Get integrations

`GET api/integrations?integrationId={optionalIntegrationId}`

Expected response:

```json
{
	"Error": { "Code": "0", "Message": "SUCCESS" },
	"Content": [
		{
			"id": "integration-id",
			"provider": "Google",
			"email": "person@example.com",
			"userId": "provider-user-id",
			"location": {
				"id": "location-id",
				"description": "Office",
				"address": "123 Main St",
				"longitude": -73.9857,
				"latitude": 40.7484,
				"isVerified": true
			},
			"calendarItems": [
				{
					"id": "calendar-id",
					"name": "Work",
					"isSelected": true,
					"isEnabled": true
				}
			]
		}
	]
}
```

The web model should tolerate nullable or missing `email`, `userId`, `location`, and `calendarItems` values.

### Google connection

Mobile currently uses:

`POST api/integrations/google`

with:

- `ThirdPartyId`
- `Email`
- `DisplayName`
- `Provider`
- `ServerAuthCode`
- `RedirectUri`

The web is expected to initiate `Account/ExternalLogin` instead. Confirm whether the server callback internally invokes the equivalent integration-linking behavior. Do not assume the mobile endpoint is appropriate for a browser OAuth flow.

### Delete integration

`DELETE api/Integrations`

Mobile sends JSON containing:

- `IntegrationId`
- `Provider`
- `MobileApp: true`

Confirm the browser payload. Preferred behavior is to omit mobile-only fields unless the backend requires an explicit web marker.

### Update integration location

`POST api/integrations/location`

Mobile sends:

- `Id`
- `ThirdPartyId`
- `Longitude`
- `Latitude`
- `Address`
- `Description`
- `IsVerified`
- `ThirdPartyCalendarId`

The web should map its `EventLocation` shape explicitly rather than passing UI state directly to the API.

### Update calendar item

`POST api/Integrations/google/calendarItem`

Mobile sends:

- `CalendarId`
- `CalendarName`
- `IsSelected`
- `IntegrationId`
- `ThirdPartyType: google`
- `CalendarItemId`
- `MobileApp: true`

Confirm whether the backend supports a true batch payload. If it does not, the service should send one request per changed item and define partial-failure behavior before implementation.

## 6. OAuth Redirect Contract

The recommended web redirects are:

- Success: `/settings/connections?oauth=success&provider=google`
- Cancellation: `/settings/connections?oauth=cancelled&provider=google`
- Failure: `/settings/connections?oauth=error&provider=google&reason=access_denied`

The `provider` value must be a non-sensitive identifier such as `google`. It must never contain an email address, account ID, authorization code, access token, refresh token, or provider response payload.

After returning, the page should:

1. Read `oauth` and `provider`.
2. Validate that the provider is supported.
3. Display one provider-specific notification.
4. Refresh integrations only for a successful result.
5. Remove transient query parameters with replace navigation.
6. Leave the clean URL as `/settings/connections`.

The server should generate or validate the final return destination. The client must not be able to provide an arbitrary redirect URL.

### Required backend confirmation

Before Phase 1 is marked complete, confirm:

- Whether `Account/ExternalLogin` distinguishes calendar linking from normal Tiler sign-in.
- Whether an action, return URL, or linking parameter is required.
- The exact server callback and final browser redirect URLs.
- The exact Google Calendar scopes.
- The OAuth state and CSRF protection mechanism.
- Whether the existing authentication cookie survives the round trip.
- The success, cancellation, and failure result format.
- Whether errors can expose sensitive provider response data in the URL.
- Whether browser requests require an antiforgery header or token.
- Whether multiple Google connections are allowed.
- Whether duplicate connections are rejected or merged.

## 7. Proposed Web Architecture

### Routes

- `/settings/connections`
    - Provider rows and connected integration summaries.
- `/settings/connections/:integrationId`
    - Integration detail, location selection, calendar draft, and Save.

The route constants belong in `src/core/constants/routes.ts`. Route registration belongs in the protected Settings branch of `src/App.tsx`.

### API layer

Create a dedicated `src/api/integrationApi.ts` or repository-approved equivalent. It should:

- Extend `AppApi`.
- Use `credentials: 'include'` through the shared request wrapper.
- Define request and response types.
- Keep API field names separate from UI field names.
- Normalize the existing server error shape consistently.
- Avoid logging credentials or provider response bodies.

### Service/state layer

Use a service and React hook, or the closest existing web pattern, to own:

- Initial fetch.
- OAuth result handling.
- Refresh after mutations.
- Local calendar draft state.
- Dirty-state detection.
- Batch Save.
- Disconnect confirmation state.
- Retry state.
- Cancellation on unmount or route change.

Do not put raw fetch calls or payload construction directly into presentational rows.

### UI components

Suggested boundaries:

- `ConnectionsPage`
- `ProviderConnectionRow`
- `IntegrationSummary`
- `IntegrationDetailPage`
- `IntegrationLocationEditor`
- `CalendarSelectionEditor`
- `DisconnectConfirmation`

These are conceptual boundaries. Follow existing repository naming and component patterns when implementation begins.

## 8. Implementation Tracker

Status values: `TODO`, `IN PROGRESS`, `BLOCKED`, `DONE`, `NEEDS FEEDBACK`.

### Phase 0: Contract and instrumentation readiness

**Status:** `TODO`

**Objective:** Remove backend ambiguity and define observable behavior before UI implementation.

**Implementation tasks:**

- [ ] Confirm the browser OAuth start, callback, and final redirect contract.
- [ ] Confirm calendar scopes and consent behavior.
- [ ] Confirm browser payload requirements for delete, location, and calendar updates.
- [ ] Confirm batch versus per-calendar update semantics.
- [ ] Confirm antiforgery requirements.
- [ ] Confirm duplicate and multiple-account behavior.
- [ ] Define event names and non-sensitive event properties.
- [ ] Define error codes/messages that can be shown to users.
- [ ] Define a support/debug correlation ID policy if the backend provides one.

**TDD tests:**

- [ ] Add contract fixtures for success, empty, malformed, and error integration responses.
- [ ] Add tests that assert sensitive OAuth values are never included in client redirect handling.
- [ ] Add tests for supported and unsupported provider query values.

**User feedback:**

- Ask product/backend reviewers to approve the OAuth sequence diagram and payload table.
- Ask support/product reviewers which error messages are understandable and actionable.

**Logging and error detection:**

- Log only event name, provider, route, result category, and correlation ID.
- Never log authorization codes, tokens, raw OAuth query strings, or account secrets.
- Record contract mismatches as development errors with redacted payload keys.

**Exit criteria:**

- [ ] Backend owner confirms the contract in writing.
- [ ] Product owner confirms v1 behavior.
- [ ] TDD fixtures exist for all expected response categories.
- [ ] No unresolved security question blocks OAuth design.

### Phase 1: Route and Settings entry

**Status:** `TODO`

**Objective:** Make Connections reachable with protected, refreshable routes.

**Implementation tasks:**

- [ ] Add `SettingsConnections` and `SettingsConnectionDetail` route constants.
- [ ] Add Connections to `SettingsLayout`.
- [ ] Register the list and detail routes in `App.tsx`.
- [ ] Preserve the existing Settings outlet behavior.
- [ ] Add a route-level loading/error fallback if required by the application shell.

**TDD tests first:**

- [ ] Settings index renders the Connections entry.
- [ ] Selecting Connections navigates to `/settings/connections`.
- [ ] The list route is protected and redirects unauthenticated users consistently.
- [ ] `/settings/connections/:integrationId` renders through the Settings outlet.
- [ ] A detail URL survives direct navigation and browser refresh.

**User feedback:**

- Verify labels, ordering, breadcrumb behavior, and back navigation with a desktop and mobile-width review.
- Confirm whether Connections should appear before or after Notification Preferences.

**Logging and error detection:**

- Add page-view analytics for the list and detail route.
- Add a development-only route diagnostic if an invalid integration ID is loaded.
- Do not treat a route load as a connection attempt.

**Exit criteria:**

- [ ] Route tests are green.
- [ ] Protected routing behaves like existing Settings pages.
- [ ] Manual navigation and refresh work.

### Phase 2: Models and read API

**Status:** `DONE`

**Objective:** Fetch and safely map the mobile-compatible integration response.

**Implementation tasks:**

- [x] Define integration, calendar item, and integration location types.
- [x] Define the response envelope type.
- [x] Implement `getIntegrations(integrationId?)`.
- [x] Map nullable fields safely.
- [x] Keep provider capability metadata separate from returned records.
- [x] Expose normalized errors to the service layer.

**TDD tests first:**

- [x] Successful response maps all integration fields.
- [x] Empty Content maps to an empty list.
- [x] Missing location maps to null without throwing.
- [x] Missing calendar items maps to an empty list or documented null behavior.
- [x] HTTP errors and structured server errors reject consistently.
- [x] Requests include credentials and the optional integration ID only when present.
- [x] No provider token or secret is retained in the mapped model.

**User feedback:**

- Review connected and empty states with realistic account data.
- Confirm account display precedence: email, user ID, or another server field.

**Logging and error detection:**

- Log request start/end categories and duration in development/diagnostic telemetry.
- Record HTTP status and server error code, not response bodies.
- Include integration count, not integration contents, in diagnostics.

**Exit criteria:**

- [x] API tests are green.
- [x] TypeScript build passes.
- [x] Fixtures represent real backend casing and nullability.

### Phase 3: Connections list and OAuth return handling

**Status:** `IN PROGRESS` — automated implementation and tests complete (29 tests: `ConnectionsSettings.test.tsx` + `oauthUrl.test.ts`); live manual OAuth redirect QA pending.

**Objective:** Render the provider list and complete the server-owned OAuth round trip.

**Implementation tasks:**

- [x] Render Google as available.
- [x] Render Microsoft, Apple, Slack, and Google Tasks as unavailable (rendered as "Coming soon" from `CONNECTION_PROVIDERS`).
- [x] Implement the Google Add action. The confirmed contract (Phase 0, verified against TilerFront) is a server-owned `GET api/Integrations?provider=google&redirectTarget=<own-origin URL>` browser navigation built by `buildOauthStartUrl`, not an `Account/ExternalLogin` form post.
- [x] Preserve the intended Connections return destination (`redirectTarget` = own origin + `/settings/connections`).
- [x] Parse the transient OAuth return parameters on return via `parseOauthReturn` over the router's `location.search` (the verified contract carries `calendarConnect`/`integrationId`/`reason`, not `oauth`/`provider`).
- [x] Show one success, cancellation, or error notification (auto-dismiss after 6 s).
- [x] Refresh integrations after success only.
- [x] Clear transient query parameters with replace navigation.
- [x] Prevent duplicate refreshes caused by React effects or browser back navigation (`oauthHandledRef` one-shot guard).

**TDD tests first:**

- [x] Google Add builds the expected start URL (`provider` + `redirectTarget` only) and navigates the browser to it.
- [x] A successful OAuth result refreshes integrations.
- [x] A cancelled OAuth result shows cancellation feedback and does not refresh unnecessarily.
- [x] An error result shows provider-specific failure feedback.
- [x] Unsupported or malformed OAuth values are handled safely.
- [x] Query parameters are removed after handling.
- [x] Refresh does not repeat after the clean URL is established.
- [x] Empty, loading, retry, and loaded states render correctly.

**User feedback:**

- Test wording for success, cancellation, expired consent, denied consent, and network failure.
- Confirm whether the user should see a generic error or a retry action.
- Validate provider logos and accessible names.

**Logging and error detection:**

- Track `connection_oauth_started`, `connection_oauth_returned`, and `connection_oauth_result`.
- Include provider, result category, and elapsed time.
- Do not include raw query strings or provider error descriptions without redaction.
- Add a diagnostic when an OAuth success return is followed by zero integrations, while avoiding user-identifying data.

**Exit criteria:**

- [x] OAuth contract tests pass against approved fixtures.
- [ ] Manual success and failure redirects behave correctly (pending live QA).
- [x] Clean URL is restored.
- [ ] The newly connected integration appears after server refresh (pending live QA; the refresh-on-success behavior itself is unit-tested).

### Phase 4: Integration detail and location draft

**Status:** `TODO`

**Objective:** Manage a connection location using the existing web search/select behavior.

**Implementation tasks:**

- [ ] Load a single integration or select it from the list response.
- [ ] Render current location and an unset-location state.
- [ ] Reuse the debounced location search pattern from `EditCalendarEvent.tsx`.
- [ ] Map selected `EventLocation` to the integration location request shape.
- [ ] Keep location changes in the local draft until Save.
- [ ] Track dirty state.
- [ ] Warn or confirm before leaving with unsaved changes if the existing app pattern supports it.

**TDD tests first:**

- [ ] Detail page renders the existing location.
- [ ] Detail page renders a clear unset state.
- [ ] Search starts only after the minimum input length.
- [ ] Search is debounced and stale results do not overwrite newer results.
- [ ] Selecting a location updates the local draft.
- [ ] Clearing the location behaves according to the approved contract.
- [ ] Save maps all required location fields correctly.
- [ ] API failure preserves the draft and displays retryable feedback.

**User feedback:**

- Review search result density, keyboard navigation, selection clarity, and mobile-width behavior.
- Confirm whether Google map results and saved Tiler locations should look different.
- Confirm whether an integration may be saved without a location.

**Logging and error detection:**

- Track search success/failure counts and latency without logging typed addresses.
- Track location save result and provider only.
- Detect stale-result races and cancelled requests in development telemetry.

**Exit criteria:**

- [ ] Location API/service tests are green.
- [ ] Location search is accessible by keyboard.
- [ ] Save failure does not discard user input.
- [ ] Backend payload has been verified with a real integration.

### Phase 5: Calendar selection draft and batch Save

**Status:** `TODO`

**Objective:** Match mobile calendar selection behavior while using an explicit web Save flow.

**Implementation tasks:**

- [ ] Render calendar items and enabled/disabled state.
- [ ] Initialize a deep local draft from server data.
- [ ] Display selected count and total count.
- [ ] Allow toggling enabled calendar items.
- [ ] Keep changes local until Save.
- [ ] Calculate the minimal changed set.
- [ ] Implement the confirmed batch endpoint or sequential update strategy.
- [ ] Define behavior for partial failure.
- [ ] Refresh server state after successful Save.
- [ ] Disable duplicate submissions while Save is pending.

**TDD tests first:**

- [ ] Calendar items initialize from the API response.
- [ ] Selected count updates immediately in the draft.
- [ ] Disabled items cannot be toggled if the backend marks them unavailable.
- [ ] Reverting a toggle removes it from the changed set.
- [ ] Save submits only changed values if supported.
- [ ] Save submits the expected provider and integration identifiers.
- [ ] Successful Save refreshes the server state.
- [ ] Failed Save preserves the draft and reports the failed operation.
- [ ] Partial failure behavior matches the approved contract.
- [ ] Double-clicking Save does not duplicate requests.

**User feedback:**

- Validate whether explicit Save is discoverable and whether unsaved changes are obvious.
- Confirm copy for selected count, no calendars, disabled calendars, and save failure.
- Confirm whether navigation away with a dirty draft requires confirmation.

**Logging and error detection:**

- Track calendar draft opened, changed, save started, save succeeded, and save failed.
- Include count of changed items and result category, not calendar names or account data.
- Record per-request correlation IDs for sequential updates.
- Detect server/client selection mismatches after refresh and report a diagnostic event.

**Exit criteria:**

- [ ] Draft and batch-save tests are green.
- [ ] No duplicate or lost selections occur during normal interaction.
- [ ] Partial failure behavior is tested and documented.
- [ ] Real backend verification confirms persisted selections.

### Phase 6: Disconnect and mutation resilience

**Status:** `TODO`

**Objective:** Make destructive actions clear, recoverable, and consistent with server state.

**Implementation tasks:**

- [ ] Add a confirmation dialog for disconnect.
- [ ] Include safe account context in the confirmation text.
- [ ] Submit the confirmed delete request.
- [ ] Disable duplicate deletion.
- [ ] Refresh or remove the record after success.
- [ ] Preserve the record after failure.
- [ ] Handle expired sessions and authorization errors consistently.

**TDD tests first:**

- [ ] Opening Disconnect does not call the API.
- [ ] Cancel closes the dialog without mutation.
- [ ] Confirm sends the expected integration ID and provider.
- [ ] Success removes the integration and shows feedback.
- [ ] Failure keeps the integration visible and enables retry.
- [ ] Repeated clicks do not send duplicate deletes.
- [ ] A stale detail route redirects safely after the integration is deleted.

**User feedback:**

- Validate destructive wording and whether the account email is sufficient context.
- Confirm success and failure notification placement.
- Test recovery when the browser loses connectivity during deletion.

**Logging and error detection:**

- Track disconnect opened, cancelled, started, succeeded, and failed.
- Include provider and result category only.
- Capture HTTP status/server error code and correlation ID.
- Never log request bodies containing account identifiers beyond an approved opaque ID.

**Exit criteria:**

- [ ] Disconnect tests are green.
- [ ] Confirmation and retry behavior are clear.
- [ ] Server state and UI state converge after success.

### Phase 7: Localization, accessibility, analytics, and polish

**Status:** `TODO`

**Objective:** Make the feature usable, translated, measurable, and consistent across supported locales.

**Implementation tasks:**

- [ ] Add all strings to the translation namespace.
- [ ] Update every supported locale or provide the repository-approved fallback behavior.
- [ ] Add accessible names for provider actions and status.
- [ ] Add keyboard support for rows, toggles, dialogs, and Save.
- [ ] Ensure focus moves correctly after dialogs and route changes.
- [ ] Verify responsive behavior at mobile, tablet, and desktop widths.
- [ ] Match existing Settings typography, colors, borders, and spacing.
- [ ] Add analytics events with a documented property allow-list.

**TDD tests first:**

- [ ] All controls have accessible roles and names.
- [ ] Keyboard-only flow can connect, open details, edit, save, and disconnect.
- [ ] Dialog focus is trapped and restored.
- [ ] Translation keys exist for every rendered state.
- [ ] Long translated strings do not overflow controls.
- [ ] Responsive layout tests cover the critical breakpoints.

**User feedback:**

- Run a product review in English and at least one long-string locale.
- Review with keyboard navigation and screen-reader inspection.
- Collect feedback on whether status, pending, and saved states are distinguishable.

**Logging and error detection:**

- Validate that analytics events do not contain sensitive data.
- Monitor event drop rates and unexpected result categories.
- Track client exceptions by route and feature phase.

**Exit criteria:**

- [ ] Accessibility checks pass.
- [ ] Localization review is complete.
- [ ] Analytics payloads are approved.
- [ ] Responsive visual review is complete.

### Phase 8: End-to-end validation and release readiness

**Status:** `TODO`

**Objective:** Validate the complete browser flow against the real backend and prepare operational support.

**Implementation tasks:**

- [ ] Run the complete Vitest suite.
- [ ] Run TypeScript build.
- [ ] Run lint and formatting checks.
- [ ] Exercise OAuth success, denial, cancellation, and expired-session paths.
- [ ] Exercise empty, one-account, multiple-account, and duplicate-account behavior.
- [ ] Exercise location save and calendar batch save against a test account.
- [ ] Exercise disconnect and retry.
- [ ] Verify browser refresh at both list and detail URLs.
- [ ] Verify no secrets appear in URLs, logs, analytics, or browser storage.
- [ ] Document known backend limitations and rollback behavior.

**TDD and validation commands:**

```text
npm run test:run
npm run test:coverage
npm run lint
npm run format:check
npm run build
```

Use the narrowest command during development and the full set before release.

**User feedback:**

- Conduct a guided acceptance test with at least one real Google account.
- Record every issue with route, phase, reproduction steps, expected result, actual result, and correlation ID.
- Classify issues as blocker, data-loss risk, OAuth/security, functional defect, accessibility, visual, or copy.

**Logging and error detection:**

- Confirm client errors are observable without exposing sensitive values.
- Confirm server correlation IDs can connect browser errors to backend logs.
- Establish dashboards or queries for OAuth failures, integration read failures, mutation failures, and client exceptions.
- Define alert thresholds before release.

**Exit criteria:**

- [ ] All required automated checks pass.
- [ ] Real OAuth round trip succeeds.
- [ ] Persisted integrations are visible after refresh.
- [ ] No known blocker or security issue remains.
- [ ] Support has troubleshooting guidance.

## 9. TDD Working Agreement

For each behavior:

1. Write the smallest failing test that expresses the desired behavior.
2. Run only that test or the narrowest relevant test file.
3. Implement the smallest production change.
4. Rerun the focused test.
5. Add boundary cases for errors, cancellation, nullability, and repeated interaction.
6. Refactor after the focused tests are green.
7. Run the broader affected suite before moving to the next phase.

Do not begin a later UI phase while its API/service contract is still undefined. A test that encodes an unconfirmed backend contract is a useful contract probe, but it must be marked `BLOCKED` until backend behavior is verified.

## 10. Error Taxonomy and Fix Loop

Every defect should be classified before repair:

- `OAUTH_CONTRACT`: redirect, state, scope, callback, or cookie mismatch.
- `API_CONTRACT`: endpoint, method, field, casing, or response mismatch.
- `AUTH_SESSION`: expired, missing, or invalid server session.
- `STATE_SYNC`: local draft differs from persisted server state.
- `ROUTING`: refresh, back navigation, or stale detail route problem.
- `UI_STATE`: loading, empty, error, pending, or retry state problem.
- `ACCESSIBILITY`: keyboard, focus, role, label, or contrast issue.
- `LOCALIZATION`: missing key, overflow, or incorrect interpolation.
- `OBSERVABILITY`: missing, duplicated, or sensitive telemetry.

For each fix, record:

- Phase and tracker item.
- Reproduction steps.
- Failing test name.
- Root cause.
- Minimal fix.
- Regression test added.
- Manual verification performed.
- Remaining risk or follow-up.

## 11. Release Checklist

- [ ] Backend OAuth contract approved.
- [ ] Google Calendar scopes approved.
- [ ] OAuth state/CSRF protection verified.
- [ ] Server session persistence verified.
- [ ] No client secret or provider token in the web bundle.
- [ ] Connections route protected.
- [ ] Integration response mapping tested.
- [ ] Location update tested.
- [ ] Calendar batch Save tested.
- [ ] Disconnect confirmation and retry tested.
- [ ] OAuth query parameters cleared after handling.
- [ ] No sensitive values in URLs, logs, analytics, or storage.
- [ ] All supported locales updated.
- [ ] Accessibility and responsive review complete.
- [ ] `npm run test:run` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run format:check` passes.
- [ ] `npm run build` passes.
- [ ] Real browser OAuth acceptance test passes.
- [ ] Support and rollback notes published.

## 12. Open Questions

These must be resolved before the relevant tracker phase is marked `DONE`:

1. Does `Account/ExternalLogin` know whether it is being used for calendar linking, or does it require an action parameter?
2. What exact Google Calendar scopes are requested?
3. What exact success, cancellation, and failure redirects are emitted?
4. Does the server accept a web return destination, and how does it prevent open redirects?
5. Does browser OAuth require a separate antiforgery token/header?
6. Should `MobileApp` be omitted, set to false, or retained for mutation requests?
7. Is calendar Save a true batch request or multiple individual requests?
8. What happens if one individual calendar update fails?
9. Can a user connect multiple Google accounts?
10. What happens when the same account is connected twice?
11. Can an integration exist without a location?
12. Are all returned calendar items selectable, or do `isEnabled` values impose restrictions?
13. Which analytics event names and properties are approved?
14. Which provider rows should appear as coming soon in the first release?

## 13. Decision Log

| Decision           | Current direction                             | Owner               | Status                            |
| ------------------ | --------------------------------------------- | ------------------- | --------------------------------- |
| Initial provider   | Google Calendar only                          | Product/Engineering | Decided                           |
| Feature scope      | Full mobile parity                            | Product/Engineering | Decided                           |
| OAuth owner        | Server-owned `Account/ExternalLogin`          | Backend             | Decided, contract details pending |
| Credential storage | Server only                                   | Backend/Security    | Decided                           |
| OAuth return       | Connections route with provider result        | Backend/Web         | Proposed                          |
| Location UX        | Web search and select                         | Web                 | Decided                           |
| Calendar UX        | Local draft with explicit batch Save          | Product/Web         | Decided                           |
| Detail routing     | Nested `/settings/connections/:integrationId` | Web                 | Decided                           |
| Disconnect UX      | Confirmation required                         | Product/Web         | Decided                           |
| Mobile fields      | Reuse endpoints, confirm browser payload      | Backend/Web         | Pending                           |
| Other providers    | Coming soon/unavailable                       | Product             | Pending final copy                |

## 14. Change History

| Date       | Change                                                                                                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-29 | Initial comprehensive architecture, OAuth, TDD, tracker, feedback, logging, and release plan.                                                                                 |
| 2026-08-30 | Phase 2 complete: shared wire/domain types, total non-throwing mapping, `getIntegrations` API and service, fixtures re-pointed at shared wire types, all Phase 2 tests green. |
