const router = require('express').Router()
const pool = require('../model/db')
const { authenticate, authorize } = require('../middleware/auth')

router.get('/', authenticate, async (req, res) => {
  const search = (req.query.search || '').trim()
  const params = []
  let where = ''

  if (search) {
    params.push(`%${search}%`)
    where = `WHERE s.name ILIKE $1 OR s.address ILIKE $1`
  }

  const result = await pool.query(
    `
      SELECT
        s.id,
        s.name,
        s.email,
        s.address,
        s.owner_id,
        COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS avg_rating,
        COUNT(r.id)::int AS rating_count
      FROM stores s
      LEFT JOIN ratings r ON r.store_id = s.id
      ${where}
      GROUP BY s.id
      ORDER BY s.name ASC
    `,
    params
  )

  res.json(result.rows)
})

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  const { name, email, address, ownerId } = req.body

  const result = await pool.query(
    `
      INSERT INTO stores (name, email, address, owner_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [name, email, address, ownerId || null]
  )

  res.status(201).json(result.rows[0])
})

router.get('/owner', authenticate, authorize('store_owner'), async (req, res) => {
  const result = await pool.query(
    `
      SELECT
        s.id,
        s.name,
        s.address,
        COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS avg_rating,
        COUNT(r.id)::int AS rating_count
      FROM stores s
      LEFT JOIN ratings r ON r.store_id = s.id
      WHERE s.owner_id = $1
      GROUP BY s.id
      ORDER BY s.name ASC
    `,
    [req.user.id]
  )

  res.json(result.rows)
})

module.exports = router