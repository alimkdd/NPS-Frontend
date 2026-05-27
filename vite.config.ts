import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// Lock to port 5173 (matches the backend's CORS allow-list) and fail fast if
// it's taken — `strictPort: true` prevents Vite from silently sliding to 5174.
//
// HTTPS uses mkcert-issued certs from ./certs/ (a one-time setup; see README).
// If the cert files aren't there yet, fall back to plain HTTP so newcomers
// aren't blocked.
const certDir = path.resolve(__dirname, 'certs');
const certPath = path.join(certDir, 'localhost.pem');
const keyPath = path.join(certDir, 'localhost-key.pem');
const hasMkcert = fs.existsSync(certPath) && fs.existsSync(keyPath);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    https: hasMkcert
      ? {
          cert: fs.readFileSync(certPath),
          key: fs.readFileSync(keyPath),
        }
      : undefined,
  },
});
