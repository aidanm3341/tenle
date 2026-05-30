import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Hosted as a GitHub Pages project site at https://<user>.github.io/tenle/
// so assets and routing live under the '/tenle/' base path.
// If you rename the repo, update this base to match.
export default defineConfig({
  base: '/tenle/',
  plugins: [
    react(),
    {
      // GitHub Pages has no server-side SPA fallback. Copying index.html to
      // 404.html makes deep links like /tenle/5 boot the app instead of 404ing.
      name: 'spa-404-fallback',
      closeBundle() {
        const dist = resolve(process.cwd(), 'dist')
        copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'))
      },
    },
  ],
})
