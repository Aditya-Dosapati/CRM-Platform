import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Support both frontend/.env and root ../.env
const hasFrontendEnv = fs.existsSync(path.resolve(__dirname, '.env')) || fs.existsSync(path.resolve(__dirname, '.env.local'));
const envDir = hasFrontendEnv ? './' : '../';

export default defineConfig({
  plugins: [react()],
  envDir,
  server: {
    port: 5000,
    host: true
  }
});
