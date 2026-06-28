import { defineConfig } from 'vitest/config'

// Kept separate from vite.config.js so the PWA plugin isn't loaded under test.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
})
