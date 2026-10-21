import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://rewritelabs.io',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', assets: '_cs' },
});
