require('dotenv').config()
const express  = require('express')
const cors     = require('cors')
const path     = require('path')
const fs       = require('fs')

const app = express()

// ── MIDDLEWARE ────────────────────────────────────────────
app.use(cors())
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true, limit: '20mb' }))

// ── UPLOADS (serve uploaded images) ──────────────────────
const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
app.use('/uploads', express.static(uploadDir))

// ── API ROUTES ────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'))
app.use('/api/users',    require('./routes/users'))
app.use('/api/posts',    require('./routes/posts'))
app.use('/api/messages', require('./routes/messages'))

// ── HEALTH CHECK ──────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'Sync Everyone' }))

// ── SERVE REACT APP (production) ──────────────────────────
const publicDir = path.join(__dirname, 'public')
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir))
  // All non-API routes → React app
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(publicDir, 'index.html'))
    }
  })
}

// ── START ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`✅ Sync Everyone running on port ${PORT}`)
})
