
# Daily Practice

A personal health and habit tracker built with React, shaped around the [Busy Dad Training](https://busydadtraining.com/) philosophy: focus on the movement, not the number. Track daily practices, set weekly goals, and build streaks over time.

## Features

- **Morning Numbers**: Each day proposes your numbers (burpees or navy seals, pull-ups) from your weekly goals — review, adjust one-offs, and accept them.
- **Flow Timer**: A numbers-free 20-minute workout timer. A bell-strike pulse blooms once per rep with a warm chime (plus haptics) — no counters, no clocks, no overthinking. Audio-only milestones mark the halfway rep and the final three, and a distinct descending phrase signals the finish.
- **Session Recording** (optional): record your workout for self-review with a mirrored live preview. Recordings auto-save to on-device storage with a list to replay, download, or delete — video never leaves the device. Works with phone cameras or webcams, with a device picker.
- **Daily Tracking**: Habit checkboxes (workout, stretch, read + coffee), pull-ups with actual rep counts, and a hydration tally.
- **Weekly Goals**: Set targets for burpees, navy seals, and pull-ups each week, with carry-over when a week isn't explicitly set.
- **Trends**: Current/longest streak, 30-day completion, a 12-week consistency heatmap, and pull-up progression.
- **Tomorrow Preview**: A collapsed peek at tomorrow's workout and stretch routine for planning around real life.
- **Sunday Reflection**: Weekly planning section showing next week's numbers inline.
- **Mobility Links**: Rotating WLC stretch videos (Mon–Sat).
- **Progressive Web App**: Works offline, installable, auto-updates.
- **Firebase Auth & Firestore**: Google sign-in (via Google Identity Services) with per-user cloud data, locked down by version-controlled security rules (`firestore.rules`).

## Technologies

- **React 18** with Vite
- **Firebase** (Auth + Firestore + Hosting)
- **Google Identity Services** for OAuth sign-in
- **Moment.js** for date handling
- **Vitest** for unit tests
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
5. **Deploy security rules**: `firestore.rules` restricts each user to their own data. Deploy with `firebase deploy --only firestore:rules` (also runs automatically in CI).

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

### Testing

```bash
npm test           # run the Vitest suite once
npm run test:watch # watch mode
npm run lint       # eslint
```

The suite covers the pure logic: workout scheduling and goal carry-over, streak calculation, and trends/statistics.

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
   firebase deploy --only hosting,firestore:rules
   ```

## CI/CD (GitHub Actions)

- **`ci.yml`** runs lint, tests, and a build on every pull request. The `test` check is required by branch protection before merging to `main`.
- **`firebase-hosting.yml`** runs on pushes to `main` and tags: lint → test → build, then deploys Hosting **and** Firestore rules — a failing check aborts the deploy.

Required GitHub Actions secrets:
- `FIREBASE_SERVICE_ACCOUNT` — service account JSON (Hosting deploy + Firestore rules; needs `firebaserules.admin` and `serviceusage.serviceUsageConsumer` roles)
- `FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_*` — all Firebase config values from `.env.example`
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth 2.0 Client ID

## Project Structure

```
src/
├── main.jsx                   # Entry point, PWA registration
├── App.jsx                    # Root component, auth, data loading, view toggle
├── App.css                    # Global styles (paper aesthetic)
├── firebase.js                # Firebase initialization
├── components/
│   ├── DayView.jsx            # Main day orchestrator
│   ├── DayNavigation.jsx      # Date picker with prev/next
│   ├── StreakDisplay.jsx      # Streak counter
│   ├── MorningTargets.jsx     # Accept/adjust today's numbers
│   ├── MorningRitual.jsx      # Morning routine section
│   ├── PullupsRow.jsx         # Pull-ups with rep stepper
│   ├── EndOfDay.jsx           # Hydration section
│   ├── HabitRow.jsx           # Reusable checkbox row
│   ├── HydrationRow.jsx       # 3-bottle water tracker
│   ├── icons.jsx              # Shared inline SVG icons
│   ├── FlowTimer.jsx          # Flow workout timer + camera session
│   ├── FlowTimer.css          # Timer styles
│   ├── RecordingsList.jsx     # Saved recordings: play/download/delete
│   ├── TrendsView.jsx         # Streaks, heatmap, pull-up progression
│   ├── TomorrowPreview.jsx    # Collapsed peek at tomorrow's plan
│   ├── FourAgreements.jsx     # Expandable philosophy section
│   ├── SundayReflection.jsx   # Sunday planning section
│   ├── WeeklyTargetsModal.jsx # Weekly goals form
│   ├── Modal.jsx              # Generic modal
│   └── Attributions.jsx       # Footer credits
├── hooks/
│   └── useCameraRecorder.js   # Camera + session recording
├── data/
│   └── practicesData.js       # Mobility video links
└── utils/
    ├── dateUtils.js           # Date helpers, debug override
    ├── scheduleUtils.js       # Workout schedule, goal resolution
    ├── streakUtils.js         # Streak calculation
    ├── statsUtils.js          # Trends/heatmap statistics
    └── recordingsStore.js     # On-device video storage (IndexedDB)
```

## Author

Kevin Oliver — [kmo1992](https://github.com/kmo1992)

## License

MIT
