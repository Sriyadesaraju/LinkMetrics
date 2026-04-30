import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import { errorHandler } from './middleware/errorHandler'
import authRoutes from './routes/auth.routes'
import linkRoutes from './routes/link.routes'
import { RedirectController } from './controllers/redirect.controller'  // add this
import workspaceRoutes from './routes/workspace.routes'   // add this



const required = ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN']
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`)
}

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(helmet())
app.use(express.json())


// API routes first
app.use('/api/auth', authRoutes)
app.use('/api/links', linkRoutes)
// then with your other routes:
app.use('/api/workspaces', workspaceRoutes)

// Catch-all redirect — MUST be last before error handler
app.get('/:slug', RedirectController.redirect)

app.use(errorHandler)

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))