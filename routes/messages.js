const router = require('express').Router()
const db     = require('../db')
const auth   = require('../middleware/auth')

const uid = () => Math.random().toString(36).slice(2, 10)

// ── GET ALL CONVERSATIONS ─────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const [convs] = await db.query(`
      SELECT c.*,
             (SELECT text FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
             (SELECT created_at FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_message_time
      FROM conversations c
      JOIN conversation_members cm ON cm.conversation_id=c.id
      WHERE cm.user_id=?
      ORDER BY last_message_time DESC
    `, [req.user.id])

    for (const conv of convs) {
      const [members] = await db.query(`
        SELECT u.id,u.name,u.handle,u.avatar_url,u.color
        FROM conversation_members cm JOIN users u ON u.id=cm.user_id
        WHERE cm.conversation_id=? AND u.id!=?
      `, [conv.id, req.user.id])
      conv.members = members
    }
    res.json(convs)
  } catch (err) {
    console.error('Get convs error:', err)
    res.status(500).json({ error: 'Server error: ' + err.message })
  }
})

// ── CREATE DIRECT CONVERSATION ────────────────────────────
router.post('/direct/:userId', auth, async (req, res) => {
  const otherId = req.params.userId
  try {
    const [existing] = await db.query(`
      SELECT c.id FROM conversations c
      JOIN conversation_members cm1 ON cm1.conversation_id=c.id AND cm1.user_id=?
      JOIN conversation_members cm2 ON cm2.conversation_id=c.id AND cm2.user_id=?
      WHERE c.type='direct'
      LIMIT 1
    `, [req.user.id, otherId])

    if (existing.length) return res.json({ id: existing[0].id })

    const id = 'cv' + uid()
    await db.query('INSERT INTO conversations (id,type) VALUES (?,?)', [id, 'direct'])
    await db.query('INSERT INTO conversation_members (conversation_id,user_id) VALUES (?,?),(?,?)', [id, req.user.id, id, otherId])
    res.status(201).json({ id })
  } catch (err) {
    console.error('Create conv error:', err)
    res.status(500).json({ error: 'Server error: ' + err.message })
  }
})

// ── GET MESSAGES IN CONVERSATION ──────────────────────────
router.get('/:convId/messages', auth, async (req, res) => {
  try {
    const [membership] = await db.query(
      'SELECT 1 FROM conversation_members WHERE conversation_id=? AND user_id=?',
      [req.params.convId, req.user.id]
    )
    if (!membership.length) return res.status(403).json({ error: 'Access denied' })

    const [messages] = await db.query(`
      SELECT m.*, u.name, u.handle, u.avatar_url, u.color
      FROM messages m JOIN users u ON u.id=m.user_id
      WHERE m.conversation_id=?
      ORDER BY m.created_at ASC
      LIMIT 100
    `, [req.params.convId])
    res.json(messages)
  } catch (err) {
    console.error('Get messages error:', err)
    res.status(500).json({ error: 'Server error: ' + err.message })
  }
})

// ── SEND MESSAGE ──────────────────────────────────────────
router.post('/:convId/messages', auth, async (req, res) => {
  const { text } = req.body
  if (!text?.trim()) return res.status(400).json({ error: 'Message text required' })
  try {
    const [membership] = await db.query(
      'SELECT 1 FROM conversation_members WHERE conversation_id=? AND user_id=?',
      [req.params.convId, req.user.id]
    )
    if (!membership.length) return res.status(403).json({ error: 'Access denied' })

    const id = 'm' + uid()
    await db.query('INSERT INTO messages (id,conversation_id,user_id,text) VALUES (?,?,?,?)',
      [id, req.params.convId, req.user.id, text.trim()])
    const [rows] = await db.query(`
      SELECT m.*, u.name, u.handle, u.avatar_url, u.color
      FROM messages m JOIN users u ON u.id=m.user_id WHERE m.id=?
    `, [id])
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Send message error:', err)
    res.status(500).json({ error: 'Server error: ' + err.message })
  }
})

module.exports = router
