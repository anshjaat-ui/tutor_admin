import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
  },
  preview: {
    port: process.env.PORT || 4174,
    host: true,
    // Render/Railway jaise platforms apna khud ka dynamic hostname dete hain
    // (e.g. teotia-shopprix-bka4.onrender.com) — Vite naye versions mein
    // security ke liye unknown hosts block karta hai, isliye sab allow kar rahe hain
    allowedHosts: true,
  },
})
