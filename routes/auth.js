const router  = require('express').Router()
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const db      = require('../db')
const { body, validationResult } = require('express-validator')

const uid = () => Math.random().toString(36).slice(2, 10)
const COLORS = ['#e8a045','#5aab72','#c07dd4','#e06b6b','#4bacc6','#e87c5a','#6ab8c8']
const pickColor = s => COLORS[s.charCodeAt(0) % COLORS.length]
const mkToken = user => jwt.sign({ id: user.id, handle: user.handle }, process.env.JWT_SECRET, { expiresIn: '30d' })

// ── REGISTER ─────────────────────────────────────────────
router.post('/register',
  body('name').trim().notEmpty(),
  body('handle').trim().matches(/^[a-z0-9_]+$/i),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { name, handle, email, password, bio, color } = req.body
    try {
      // Check duplicates
      const [existing] = await db.query(
        'SELECT id FROM users WHERE handle=? OR email=?',
        [handle.toLowerCase(), email]
      )
      if (existing.length) {
        const field = existing[0].handle === handle.toLowerCase() ? 'handle' : 'email'
        return res.status(409).json({ error: `That ${field} is already taken` })
      }

      const hash = await bcrypt.hash(password, 12)
      const id   = 'u' + uid()
      const userColor = color || pickColor(name)

      await db.query(
        'INSERT INTO users (id,name,handle,email,password,bio,color) VALUES (?,?,?,?,?,?,?)',
        [id, name, handle.toLowerCase(), email, hash, bio || 'New Sync Everyone member 👋', userColor]
      )

      const [rows] = await db.query('SELECT id,name,handle,email,bio,avatar_url,color,created_at FROM users WHERE id=?', [id])
      res.status(201).json({ user: rows[0], token: mkToken(rows[0]) })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Server error' })
    }
  }
)

// ── LOGIN ─────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body
  if (!identifier || !password) return res.status(400).json({ error: 'Missing fields' })
  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE handle=? OR email=?',
      [identifier.toLowerCase(), identifier.toLowerCase()]
    )
    if (!rows.length) return res.status(401).json({ error: 'Invalid username or password' })

    const user = rows[0]
    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ error: 'Invalid username or password' })

    const { password: _, ...safeUser } = user
    res.json({ user: safeUser, token: mkToken(safeUser) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET CURRENT USER ──────────────────────────────────────
const auth = require('../middleware/auth')
router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id,name,handle,email,bio,avatar_url,color,created_at FROM users WHERE id=?',
      [req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'User not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
