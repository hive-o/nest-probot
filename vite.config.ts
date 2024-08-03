import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  cacheDir: './node_modules/.vite/nest-probot',
  plugins: [nxViteTsPaths()],

  root: __dirname,

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },

  test: {
    coverage: { provider: 'v8', reportsDirectory: './coverage/nest-probot' },
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    watch: false,
  },
});
