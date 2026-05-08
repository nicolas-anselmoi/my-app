import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Dev-only adapter so /api/* serverless handlers work with `npm run dev`.
// In production, Vercel runs these directly.
function apiDevPlugin() {
  const routes = ['/api/fetch-image', '/api/cart-charms']
  return {
    name: 'api-dev',
    configureServer(server) {
      for (const route of routes) {
        server.middlewares.use(route, async (req, res, next) => {
          try {
            const mod = await server.ssrLoadModule(`${route}.js`)
            const handler = mod.default
            const url = new URL(req.url, 'http://localhost')
            req.query = Object.fromEntries(url.searchParams)
            // URLSearchParams' Object.fromEntries collapses duplicates; for
            // routes that need every value (e.g. multiple ?sku=...), expose
            // a getAll-friendly helper too.
            req.queryAll = (key) => url.searchParams.getAll(key)
            await handler(req, res)
          } catch (err) {
            next(err)
          }
        })
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiDevPlugin()],
})
