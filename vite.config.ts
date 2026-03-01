import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        arjs: resolve(__dirname, 'arjs.html'),
        mindar: resolve(__dirname, 'mindar.html'),
        mediapipe: resolve(__dirname, 'mediapipe.html'),
      },
    },
  },
})
