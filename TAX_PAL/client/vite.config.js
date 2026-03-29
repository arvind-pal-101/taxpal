import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Agar local network par issue hai toh ye help karega
    host: true 
  },
  // Warnings ko kam karne ke liye logs control karein
  logLevel: 'info' 
})