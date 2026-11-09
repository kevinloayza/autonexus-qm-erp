import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Esto es clave: obliga a Vite a exponer la red (0.0.0.0) a Docker
    port: 5173,
    watch: {
      usePolling: true // Ayuda a que los cambios se detecten bien en Windows
    }
  }
})