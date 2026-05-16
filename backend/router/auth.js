const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../model/db')
const { authenticate } = require('../middleware/auth')

router.post('/signup', async (req, res) => {
  const { name, email, password, address } = req.body

  if (!name || name.length < 3) {
    return res.status(400).json({ message: 'Name is too short' })
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password is too short' })
  }

  try {
    const hashed = await bcrypt.hash(password, 10)
    const result = await pool.query(
      `
        INSERT INTO users (name, email, password, address, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, email, role
      `,
      [name, email, hashed, address || '', 'user']
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(400).json({ message: 'Email already exists' })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
  const user = result.rows[0]

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '1d' }
  )

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })
})

router.get('/me', authenticate, async (req, res) => {
  const result = await pool.query(
    'SELECT id, name, email, address, role FROM users WHERE id = $1',
    [req.user.id]
  )

  res.json(result.rows[0])
})

module.exports = router