import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Dev-only adapter so /api/* serverless handlers work with `npm run dev`.
// In production, Vercel runs these directly.
function apiDevPlugin() {
  return {
    name: 'api-dev',
    configureServer(server) {
      server.middlewares.use('/api/fetch-image', async (req, res, next) => {
        try {
          const mod = await server.ssrLoadModule('/api/fetch-image.js')
          const handler = mod.default
          const url = new URL(req.url, 'http://localhost')
          req.query = Object.fromEntries(url.searchParams)
          await handler(req, res)
        } catch (err) {
          next(err)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    apiDevPlugin(),
  ],
})
