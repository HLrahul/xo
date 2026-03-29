import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    proxy: {
      // Proxy standard HTTP REST requests (Authentication, RPCs)
      '/v2': {
        target: 'http://127.0.0.1:7350',
        changeOrigin: true
      },
      // Proxy WebSockets
      '/ws': {
        target: 'ws://127.0.0.1:7350',
        ws: true
      }
    }
  }
})
