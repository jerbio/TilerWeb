# Tiler Web

A smart calendar and task management web application that helps users schedule tasks, manage time, and boost productivity with an AI-powered assistant.

**Website:** [https://tiler.app/](https://tiler.app/)

## Features

- **Google Calendar Integration** — Sync and manage your calendar events
- **AI Chat Assistant** — Persona-based intelligent scheduling assistant with voice input support
- **Location & Transit** — Real-time travel estimates and route planning between events
- **TileShare** — Task sharing and collaboration
- **Forecast** — Find free time slots intelligently
- **Multi-language Support** — 12 languages including English, Spanish, French, German, Chinese, Japanese, and more
- **Cross-platform** — Works alongside iOS and Android native apps

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 6 |
| Styling | styled-components |
| State Management | Zustand |
| Routing | React Router 7 |
| Real-time | SignalR |
| i18n | i18next |
| Testing | Vitest + React Testing Library + MSW |

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd TilerWeb

# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file in the project root:

```env
VITE_BASE_URL=https://tiler.app/
VITE_NODE_ENV=development
VITE_ANALYTICS_PROVIDER=console
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_BASE_URL` | Backend API base URL | Yes |
| `VITE_NODE_ENV` | `development` or `production` | Yes |
| `VITE_ANALYTICS_PROVIDER` | `google`, `mixpanel`, `custom`, or `console` | No |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics measurement ID | No |

### Running the App

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | TypeScript compile + production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage report |

## Project Structure

```
src/
├── api/            # REST API layer
├── assets/         # Images, icons, persona assets
├── components/     # React components
│   ├── auth/       # Authentication UI
│   ├── features/   # Feature showcase cards
│   ├── home/       # Landing page sections
│   ├── layout/     # Layout components
│   ├── navigation/ # Navigation components
│   ├── onboarding/ # Onboarding flows
│   ├── timeline/   # Timeline/calendar UI
│   └── waitlist/   # Waitlist signup
├── config/         # Environment configuration
├── core/           # Core utilities
│   ├── auth/       # Auth provider, protected routes
│   ├── common/     # Shared components (calendar, chat, consent)
│   ├── constants/  # App constants
│   ├── error/      # Error handling
│   ├── storage/    # LocalStorage helpers
│   ├── theme/      # Theme provider (dark/light)
│   └── util/       # Analytics, time utilities
├── hooks/          # Custom React hooks
├── i18n/           # Internationalization
│   ├── config.ts   # i18next setup
│   └── locales/    # Translation files (12 languages)
├── pages/          # Page components
│   └── settings/   # Settings pages
├── services/       # Business logic services
└── test/           # Test setup and mocks
```

## Testing

```bash
# Run tests in watch mode
npm run test

# Run tests with coverage
npm run test:coverage
```

Tests use **Vitest** with **jsdom** environment and **MSW** for API mocking.

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run lint` and `npm run test` to ensure quality
4. Submit a pull request

## License

Proprietary - All rights reserved.

