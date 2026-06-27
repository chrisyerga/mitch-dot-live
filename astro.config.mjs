// @ts-check
import { defineConfig } from 'astro/config';
import { visualizer } from 'rollup-plugin-visualizer';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://ismitchmcconnella.live',
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/admin'),
      serialize(item) {
        // Signal freshness on every deploy; the tracker's content is
        // refreshed each time the site is rebuilt and shipped.
        item.lastmod = new Date().toISOString();
        return item;
      },
    }),
  ],

  vite: {
    plugins: [
      tailwindcss(),
      visualizer({
        filename: 'stats.html',
        open: true, // Opens the visualizer automatically after build
        gzipSize: true,
      })
    ],
  },
});




