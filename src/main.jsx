import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// registerType is 'autoUpdate': a new service worker activates immediately
// (skipWaiting + clientsClaim) and the page reloads itself. The browser only
// looks for a new worker on navigation, though — and iOS resumes installed
// PWAs from a saved state with no navigation — so we trigger the check
// ourselves whenever the app is opened or foregrounded (plus hourly, for
// sessions left open).
registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    if (!registration) return
    const checkForUpdate = () => registration.update().catch(() => {})
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkForUpdate()
    })
    window.setInterval(checkForUpdate, 60 * 60 * 1000)
  },
})
