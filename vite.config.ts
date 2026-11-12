import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

const SERVER_ENV_KEYS = ['GEMINI_API_KEY', 'GEMINI_MODELS', 'AI_ALLOWED_ORIGINS', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'VITE_SUPABASE_URL']
const API_FUNCTIONS = ['ai', 'usuarios']

// En desarrollo sirve las Vercel Functions de /api con el mismo código que en producción.
function vercelApiDev(): Plugin {
  return {
    name: 'ecdulearn-vercel-api-dev',
    apply: 'serve',
    configureServer(server) {
      for (const nombre of API_FUNCTIONS) server.middlewares.use(`/api/${nombre}`, async (req, res) => {
        try {
          const mod = await server.ssrLoadModule(`/api/${nombre}.ts`)
          const handler = mod[req.method ?? 'GET']
          if (typeof handler !== 'function') {
            res.statusCode = 405
            res.end()
            return
          }

          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)

          const headers = new Headers()
          for (const [key, value] of Object.entries(req.headers)) {
            if (typeof value === 'string') headers.set(key, value)
          }

          const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
          const request = new Request(`http://${req.headers.host}${req.originalUrl ?? `/api/${nombre}`}`, {
            method: req.method,
            headers,
            body: hasBody ? Buffer.concat(chunks) : undefined,
          })

          const response: Response = await handler(request)
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (error) {
          server.ssrFixStacktrace(error as Error)
          console.error(error)
          res.statusCode = 500
          res.end()
        }
      })
    },
  }
}

// Vite config — https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Variables sin prefijo VITE_: solo las ve el código de servidor, nunca el bundle.
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of SERVER_ENV_KEYS) {
    if (env[key] && !process.env[key]) process.env[key] = env[key]
  }

  return {
    // Vercel sirve en la raíz (/). El workflow de GitHub Pages compila con VITE_BASE=./
    base: env.VITE_BASE || "/",
    plugins: [react(), tailwindcss(), vercelApiDev()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      port: parseInt(process.env.PORT || '5173'),
      host: true,
    },
    preview: {
      port: parseInt(process.env.PORT || '8443'),
      host: true,
    },
  }
})
