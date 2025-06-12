import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/wordjumble/', // 👈 IMPORTANT: This must match your GitHub repo name
  plugins: [react()],
})


