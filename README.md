
# Daily Practice

A personal health and habit tracker built with React. Track daily practices, set weekly goals, and build streaks over time.

## Features

- **Daily Tracking**: Binary habits (workout, stretch, pull-ups, reading) and numeric tallies (hydration, eat-at-table).
- **Weekly Goals**: Set targets for burpees, navy seals, and pull-ups each week.
- **Streak Tracking**: See consecutive days of completed practices.
- **Workout Timer**: 20-minute interval timer with audio cues for burpees and navy seals.
- **Mobility Links**: Rotating WLC stretch videos (Mon–Sat).
- **Sunday Reflection**: Weekly planning section to set next week's targets.
- **Progressive Web App**: Works offline, installable, auto-updates.
- **Firebase Auth & Firestore**: Google sign-in (via Google Identity Services) with per-user cloud data.

## Technologies

- **React 18** with Vite
- **Firebase** (Auth + Firestore)
- **Google Identity Services** for OAuth sign-in
- **Moment.js** for date handling
- **vite-plugin-pwa** for offline support

## Getting Started

### Prerequisites

- Node.js (v18+)
- A Firebase project with Firestore and Google Auth enabled
- A Google OAuth 2.0 Client ID (for Google Identity Services sign-in)

### Firebase Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project (or use an existing one).
2. **Enable Firestore**: In the Firebase Console, go to **Build → Firestore Database** and click "Create database".
3. **Enable Google Auth**: Go to **Build → Authentication → Sign-in method**, then enable **Google** as a sign-in provider.
4. **Register a web app**: Go to **Project Settings** (gear icon) → **General** → scroll to "Your apps" → click the web icon (`</>`) to add a web app. After registering, you'll see a `firebaseConfig` object — these are the values you need for your `.env.local`.

### Google OAuth Client ID

The app uses Google Identity Services (GIS) for sign-in, which requires a separate OAuth Client ID:

1. Go to the [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) (make sure you're in the same GCP project linked to your Firebase project).
2. Click **Create Credentials → OAuth client ID**.
3. Set the application type to **Web application**.
4. Under **Authorized JavaScript origins**, add your domains (e.g. `http://localhost:5173` for local dev, plus your production URL).
5. Copy the generated **Client ID** — this is your `VITE_GOOGLE_CLIENT_ID`.

### Installation

```bash
git clone https://github.com/kmo1992/daily-practice.git
cd daily-practice
npm install
```

Copy `.env.example` to `.env.local` and fill in the values:

| Variable | Where to find it |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → Your apps → `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Same location → `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | Same location → `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Same location → `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Same location → `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | Same location → `appId` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Same location → `measurementId` |
| `VITE_GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials → OAuth 2.0 Client ID |

### Development

```bash
npm run dev
```

Open `http://localhost:5173`.

#### Debug Date Override (Dev Only)

Override "today" for testing:

- Query param: `http://localhost:5173/?debugDate=2026-01-12`
- Local storage: `localStorage.setItem('wlct-debug-date', '2026-01-12')`

### Production Build

```bash
npm run build
npm run preview   # preview locally
```

## Deploying to Firebase Hosting

1. Create a Firebase project and web app. Copy config values into `.env.local` (see `.env.example`).
2. Update `.firebaserc` with your project ID if needed.
3. Deploy manually:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only hosting
   ```

## CI/CD (GitHub Actions)

The workflow at `.github/workflows/firebase-hosting.yml` builds and deploys on pushes to `main` and tags.

Required GitHub Actions secrets:
- `FIREBASE_SERVICE_ACCOUNT` — service account JSON with Firebase Hosting Admin role
- `FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_*` — all Firebase config values from `.env.example`
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth 2.0 Client ID

## Project Structure

```
src/
├── main.jsx                  # Entry point, PWA registration
├── App.jsx                   # Root component, auth, data loading
├── App.css                   # Global styles
├── firebase.js               # Firebase initialization
├── components/
│   ├── DayView.jsx           # Main day orchestrator
│   ├── DayNavigation.jsx     # Date picker with prev/next
│   ├── StreakDisplay.jsx      # Streak counter
│   ├── DailyTargets.jsx       # Daily targets from weekly goals
│   ├── MorningRitual.jsx      # Morning routine section
│   ├── EndOfDay.jsx           # Daily habits section
│   ├── HabitRow.jsx           # Reusable checkbox row
│   ├── HydrationRow.jsx       # 3-bottle water tracker
│   ├── EatAtTableRow.jsx      # 3-plate meal tracker
│   ├── BurpeeTimer.jsx        # Interval workout timer
│   ├── FourAgreements.jsx     # Expandable philosophy section
│   ├── SundayReflection.jsx   # Sunday planning section
│   ├── WeeklyTargetsModal.jsx # Weekly goals form
│   ├── Modal.jsx              # Generic modal
│   └── Attributions.jsx       # Footer credits
├── data/
│   └── practicesData.js       # Mobility video links
└── utils/
    ├── dateUtils.js           # Date helpers, debug override
    ├── scheduleUtils.js       # Workout schedule, goal resolution
    └── streakUtils.js         # Streak calculation
```

## Author

Kevin Oliver — [kmo1992](https://github.com/kmo1992)

## License

MIT
