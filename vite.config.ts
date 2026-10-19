import { defineConfig } from 'vite';

// Five entries because each section is its own page now; shared modules still bundle once.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: 'index.html',
        sbc: 'sbc.html',
        players: 'players.html',
        squad: 'squad.html',
        dns: 'dns.html',
        evolutions: 'evolutions.html',
      },
    },
  },
});
