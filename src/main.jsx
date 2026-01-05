import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    if (window.confirm('New version available. Reload now?')) {
      updateSW(true)
    }
  },
})

window.setInterval(() => {
  updateSW()
}, 60 * 60 * 1000)
