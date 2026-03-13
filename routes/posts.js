const router = require('express').Router()
const db     = require('../db')
const auth   = require('../middleware/auth')
const multer = require('multer')
const path   = require('path')
const fs     = require('fs')

const uid = () => Math.random().toString(36).slice(2, 10)

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `post_${req.user.id}_${Date.now()}${ext}`)
  }
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

// ── GET FEED ──────────────────────────────────────────────
router.get('/feed', auth, async (req, res) => {
  try {
    const [posts] = await db.query(`
      SELECT p.*, u.name AS author_name, u.handle AS author_handle,
             u.avatar_url AS author_avatar, u.color AS author_color,
             (SELECT COUNT(*) FROM likes WHERE post_id=p.id) AS like_count,
             (SELECT COUNT(*) FROM comments WHERE post_id=p.id) AS comment_count,
             EXISTS(SELECT 1 FROM likes WHERE post_id=p.id AND user_id=?) AS liked_by_me
      FROM posts p
      JOIN users u ON u.id=p.user_id
      ORDER BY p.created_at DESC
      LIMIT 50
    `, [req.user.id])
    res.json(posts)
  } catch (err) {
    console.error('Feed error:', err)
    res.status(500).json({ error: 'Server error: ' + err.message })
  }
})

// ── CREATE POST ───────────────────────────────────────────
router.post('/', auth, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err)
      return res.status(400).json({ error: 'Image upload failed: ' + err.message })
    }
    next()
  })
}, async (req, res) => {
  const { caption, emoji, tags } = req.body
  if (!caption?.trim()) return res.status(400).json({ error: 'Caption required' })
  const id = 'p' + uid()
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null
  try {
    await db.query(
      'INSERT INTO posts (id,user_id,caption,image_url,emoji,tags) VALUES (?,?,?,?,?,?)',
      [id, req.user.id, caption.trim(), imageUrl, emoji || '✨', tags || '']
    )
    const [rows] = await db.query(`
      SELECT p.*, u.name AS author_name, u.handle AS author_handle,
             u.avatar_url AS author_avatar, u.color AS author_color,
             0 AS like_count, 0 AS comment_count, 0 AS liked_by_me
      FROM posts p JOIN users u ON u.id=p.user_id WHERE p.id=?
    `, [id])
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Post create error:', err)
    res.status(500).json({ error: 'Server error: ' + err.message })
  }
})

// ── LIKE / UNLIKE ─────────────────────────────────────────
router.post('/:id/like', auth, async (req, res) => {
  try {
    const [ex] = await db.query('SELECT 1 FROM likes WHERE user_id=? AND post_id=?', [req.user.id, req.params.id])
    if (ex.length) {
      await db.query('DELETE FROM likes WHERE user_id=? AND post_id=?', [req.user.id, req.params.id])
      res.json({ liked: false })
    } else {
      await db.query('INSERT INTO likes (user_id,post_id) VALUES (?,?)', [req.user.id, req.params.id])
      res.json({ liked: true })
    }
  } catch (err) {
    console.error('Like error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET COMMENTS ──────────────────────────────────────────
router.get('/:id/comments', auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, u.name, u.handle, u.avatar_url, u.color
      FROM comments c JOIN users u ON u.id=c.user_id
      WHERE c.post_id=? ORDER BY c.created_at ASC
    `, [req.params.id])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── ADD COMMENT ───────────────────────────────────────────
router.post('/:id/comments', auth, async (req, res) => {
  const { text } = req.body
  if (!text?.trim()) return res.status(400).json({ error: 'Comment text required' })
  const id = 'c' + uid()
  try {
    await db.query('INSERT INTO comments (id,post_id,user_id,text) VALUES (?,?,?,?)', [id, req.params.id, req.user.id, text.trim()])
    const [rows] = await db.query('SELECT c.*,u.name,u.handle,u.avatar_url,u.color FROM comments c JOIN users u ON u.id=c.user_id WHERE c.id=?', [id])
    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET USER POSTS ────────────────────────────────────────
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const [posts] = await db.query(`
      SELECT p.*, u.name AS author_name, u.handle AS author_handle,
             u.avatar_url AS author_avatar, u.color AS author_color,
             (SELECT COUNT(*) FROM likes WHERE post_id=p.id) AS like_count,
             (SELECT COUNT(*) FROM comments WHERE post_id=p.id) AS comment_count,
             EXISTS(SELECT 1 FROM likes WHERE post_id=p.id AND user_id=?) AS liked_by_me
      FROM posts p JOIN users u ON u.id=p.user_id
      WHERE p.user_id=? ORDER BY p.created_at DESC
    `, [req.user.id, req.params.userId])
    res.json(posts)
  } catch (err) {
    console.error('User posts error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
