const router = require('express').Router()
const pool = require('../model/db')
const { authenticate, authorize } = require('../middleware/auth')

router.post('/', authenticate, authorize('user'), async (req, res) => {
  const { storeId, rating } = req.body

  if (!storeId || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' })
  }

  const result = await pool.query(
    `
      INSERT INTO ratings (user_id, store_id, rating)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, store_id) DO UPDATE
      SET rating = EXCLUDED.rating
      RETURNING *
    `,
    [req.user.id, storeId, rating]
  )

  res.json(result.rows[0])
})

router.get('/mine', authenticate, authorize('user'), async (req, res) => {
  const result = await pool.query(
    `
      SELECT store_id, rating
      FROM ratings
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [req.user.id]
  )

  res.json(result.rows)
})

module.exports = router