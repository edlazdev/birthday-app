// @ts-check
import { defineConfig } from "astro/config";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

import tailwindcss from "@tailwindcss/vite";

import react from '@astrojs/react';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcPath = resolve(__dirname, './src');

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: [
        { find: '@', replacement: srcPath },
        { find: '@/data', replacement: resolve(srcPath, 'data') },
        { find: '@/types', replacement: resolve(srcPath, 'types') },
        { find: '@/layouts', replacement: resolve(srcPath, 'layouts') },
        { find: '@/components', replacement: resolve(srcPath, 'components') },
        { find: '@/utils', replacement: resolve(srcPath, 'utils') },
      ],
    },
  },

  site:'https://edlazdev.github.io/',
  base: '/birthday-app',
  integrations: [react()],
});