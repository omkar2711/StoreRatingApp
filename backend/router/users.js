const router = require('express').Router()
const bcrypt = require('bcryptjs')
const pool = require('../model/db')
const { authenticate, authorize } = require('../middleware/auth')

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  const result = await pool.query(
    `
      SELECT id, name, email, address, role, created_at
      FROM users
      ORDER BY id ASC
    `
  )

  res.json(result.rows)
})

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  const { name, email, password, address, role } = req.body
  const hashed = await bcrypt.hash(password || 'Temp@123', 10)

  const result = await pool.query(
    `
      INSERT INTO users (name, email, password, address, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, address, role
    `,
    [name, email, hashed, address || '', role || 'user']
  )

  res.status(201).json(result.rows[0])
})

router.get('/summary', authenticate, authorize('admin'), async (req, res) => {
  const users = await pool.query('SELECT COUNT(*)::int AS count FROM users')
  const stores = await pool.query('SELECT COUNT(*)::int AS count FROM stores')
  const ratings = await pool.query('SELECT COUNT(*)::int AS count FROM ratings')

  res.json({
    users: users.rows[0].count,
    stores: stores.rows[0].count,
    ratings: ratings.rows[0].count,
  })
})

module.exports = router