import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// Lock to port 5173 (matches the backend's CORS allow-list) and fail fast if it's
// taken — `strictPort: true` prevents Vite from silently sliding to 5174.
// basicSsl serves the dev server over self-signed HTTPS; the browser will warn
// the first time, accept it once and it sticks for the session.
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    port: 5173,
    strictPort: true,
  },
});
