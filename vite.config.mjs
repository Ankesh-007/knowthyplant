import { defineConfig } from 'vite';

// Clean URLs -> real HTML files. Used only by the dev server; production uses the
// equivalent rewrites in netlify.toml against the built dist/ output.
const routeRewrites = {
  '/':               '/public/landing.html',
  '/find-workers':   '/public/workers.html',
  '/find-workers/':  '/public/workers.html',
  '/onboarding':     '/public/onboarding.html',
  '/onboarding/':    '/public/onboarding.html',
  '/app':            '/app/index.html',
  '/app/':           '/app/index.html',
  '/backend-admin':  '/app/admin.html',
  '/backend-admin/': '/app/admin.html',
};

const cleanUrls = {
  name: 'clean-urls',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const path = req.url.split('?')[0];
      if (routeRewrites[path]) req.url = routeRewrites[path];
      next();
    });
  },
};

export default defineConfig({
  root: '.',
  // The repo's `public/` folder is real app source (not a static passthrough dir),
  // so disable Vite's default publicDir to avoid double-copying it into dist/.
  publicDir: false,
  plugins: [cleanUrls],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        landing:    'public/landing.html',
        workers:    'public/workers.html',
        onboarding: 'public/onboarding.html',
        app:        'app/index.html',
        admin:      'app/admin.html',
      },
    },
  },
  server: {
    port: 8080,
  },
});
