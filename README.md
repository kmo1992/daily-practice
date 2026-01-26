
# Healthy Habits Tracker

A React app that tracks your progress building healthy habits. Log daily practices, track nutrition points, and view weekly and full challenge charts.

## Features

- **Daily Tracking**: Log practices such as Nutrition, Exercise, Mobility, Sleep, Water, Well-being, and Reflection.
- **Weekly Navigation**: Move between weeks to review and update your progress.
- **Mobility Practices and Workouts**: See assigned mobility practices and workouts by date.
- **Data Persistence**: Progress saves to browser `localStorage`.
- **Progress Visualization**: Interactive charts for weekly and full challenge periods.

## Technologies Used

- **React**: For building the user interface.
- **Vite**: As the build tool and development server.
- **Chart.js** and **react-chartjs-2**: For rendering interactive charts.
- **Moment.js**: For date manipulation.
- **React Icons**: For displaying icons.
- **CSS**: For styling the application.

## Getting Started

### Prerequisites

- **Node.js** (version 12 or higher)
- **npm** (comes with Node.js)

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/kmo1992/whole-life-challenge-tracker.git
   cd whole-life-challenge-tracker
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

### Running the Application

Start the development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173` to view the application.

### Debug Date Override (Local Dev Only)

When running locally, you can override "today" to test different scenarios. This is disabled in production builds.

- Query param: `http://localhost:5173/?debugDate=2026-01-12`
- Local storage: `localStorage.setItem('wlct-debug-date', '2026-01-12')` and refresh
- Clear: remove the query param or run `localStorage.removeItem('wlct-debug-date')`

### Building for Production

To create a production build:

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Previewing the Production Build

To preview the production build locally:

```bash
npm run preview
```

## Deploying to Firebase Hosting

1. Create a Firebase project (free tier is fine) and a web app to obtain the values for `.env.local` (see `.env.example`).
2. Update `.firebaserc` with your Firebase project ID if it differs from `whole-life-challenge-tracker`.
3. Install the Firebase CLI locally if you want to deploy manually:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only hosting
   ```
4. The site is built from `dist` (Vite output) and served as a single-page app with rewrites handled in `firebase.json`.

Deployed URLs (Firebase free hosting):

- https://whole-life-challenge-tracker.web.app
- https://whole-life-challenge-tracker.firebaseapp.com

## CI/CD (GitHub Actions -> Firebase Hosting)

A workflow is provided at `.github/workflows/firebase-hosting.yml` that:

- Runs on pushes to `main` and any tag (e.g., `v1.0.0`).
- Installs dependencies with `npm ci`, builds the Vite app, and deploys to Firebase Hosting on the `live` channel.

Before the workflow can deploy, add these GitHub Actions secrets (Settings -> Secrets and variables -> Actions):

- `FIREBASE_SERVICE_ACCOUNT`: JSON for a Firebase service account with the **Firebase Hosting Admin** role (copy the full JSON).
- `FIREBASE_PROJECT_ID`: Firebase project ID (must match `.firebaserc`).
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional if you are not using Analytics)

The `VITE_FIREBASE_*` values must match your Firebase web app config; they are injected at build time for production deployments.

If you prefer token-based auth instead of a service account, you can set `FIREBASE_TOKEN` (from `firebase login:ci`) and swap the deploy step accordingly.

---

## Project Structure

```
├── src
│   ├── components
│   │   ├── App.jsx
│   │   ├── WeekView.jsx
│   │   ├── DayCard.jsx
│   │   ├── PracticeItem.jsx
│   │   ├── MobilitySection.jsx
│   │   ├── NavigationButtons.jsx
│   │   ├── IconKey.jsx
│   │   ├── WeeklyChart.jsx
│   │   └── EntireChallengeChart.jsx
│   ├── data
│   │   ├── practices.js
│   │   └── practicesData.js
│   ├── utils
│   │   ├── dateUtils.js
│   │   └── practiceUtils.js
│   ├── App.css
│   └── main.jsx
├── public
│   └── index.html
├── .gitignore
├── package.json
├── README.md
└── vite.config.js
```

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

## License

This project is licensed under the MIT License.

---

## Contact

- **Author**: Kevin Oliver
- **Email**: kmo1992@gmail.com
- **GitHub**: [kmo1992](https://github.com/kmo1992)

---

## Acknowledgments

- Inspired by the Whole Life Challenge.
- Thanks to all the open-source projects that made this possible.
