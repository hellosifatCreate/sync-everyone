const router = require('express').Router()
const db     = require('../db')
const auth   = require('../middleware/auth')
const multer = require('multer')
const path   = require('path')
const fs     = require('fs')

// ── FILE UPLOAD SETUP ─────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${req.user.id}_${Date.now()}${ext}`)
  }
})
const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only images allowed'))
  }
})

// ── GET USER PROFILE ──────────────────────────────────────
router.get('/:handle', auth, async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id,name,handle,bio,avatar_url,color,created_at,
        (SELECT COUNT(*) FROM follows WHERE following_id=u.id) AS followers,
        (SELECT COUNT(*) FROM follows WHERE follower_id=u.id) AS following,
        (SELECT COUNT(*) FROM posts WHERE user_id=u.id) AS post_count
       FROM users u WHERE handle=?`,
      [req.params.handle.toLowerCase()]
    )
    if (!users.length) return res.status(404).json({ error: 'User not found' })
    res.json(users[0])
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── UPDATE PROFILE ────────────────────────────────────────
router.put('/me/profile', auth, async (req, res) => {
  const { name, bio, color } = req.body
  try {
    await db.query(
      'UPDATE users SET name=COALESCE(?,name), bio=COALESCE(?,bio), color=COALESCE(?,color) WHERE id=?',
      [name || null, bio || null, color || null, req.user.id]
    )
    const [rows] = await db.query(
      'SELECT id,name,handle,email,bio,avatar_url,color FROM users WHERE id=?',
      [req.user.id]
    )
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── UPLOAD AVATAR ─────────────────────────────────────────
router.post('/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const url = `/uploads/${req.file.filename}`
  try {
    await db.query('UPDATE users SET avatar_url=? WHERE id=?', [url, req.user.id])
    res.json({ avatar_url: url })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── FOLLOW / UNFOLLOW ─────────────────────────────────────
router.post('/:id/follow', auth, async (req, res) => {
  const targetId = req.params.id
  if (targetId === req.user.id) return res.status(400).json({ error: "Can't follow yourself" })
  try {
    const [existing] = await db.query(
      'SELECT 1 FROM follows WHERE follower_id=? AND following_id=?',
      [req.user.id, targetId]
    )
    if (existing.length) {
      await db.query('DELETE FROM follows WHERE follower_id=? AND following_id=?', [req.user.id, targetId])
      res.json({ following: false })
    } else {
      await db.query('INSERT INTO follows (follower_id,following_id) VALUES (?,?)', [req.user.id, targetId])
      res.json({ following: true })
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET ALL USERS (for suggestions) ──────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id,name,handle,bio,avatar_url,color FROM users WHERE id!=? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    )
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
