import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Lock to port 5173 (matches the backend's CORS allow-list) and fail fast if it's
// taken — `strictPort: true` prevents Vite from silently sliding to 5174.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
});
