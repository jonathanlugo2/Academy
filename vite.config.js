import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  test: {
    // Los tests de la Edge Function (Deno) se ejecutan aparte con `deno test`
    include: ['src/**/*.test.{js,jsx}'],
    environment: 'node',
  },
})
