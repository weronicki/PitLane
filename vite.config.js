import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { collectionMiddleware } from './server/collection.js';

const databasePath = fileURLToPath(
  new URL('./data/collection.sqlite', import.meta.url),
);

function installCollectionApi(server) {
  const api = collectionMiddleware(databasePath);
  server.middlewares.use(api.handle);
  server.httpServer?.once('close', api.close);
}

export default defineConfig({
  server: {
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/data/**'] },
  },
  plugins: [
    {
      name: 'pit-lane-collection',
      configureServer: installCollectionApi,
      configurePreviewServer: installCollectionApi,
    },
  ],
});
