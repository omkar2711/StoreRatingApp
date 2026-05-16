const bcrypt = require('bcryptjs')
const pool = require('../model/db')

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(60) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      address VARCHAR(400),
      role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user', 'store_owner')),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stores (
      id SERIAL PRIMARY KEY,
      name VARCHAR(60) NOT NULL,
      email VARCHAR(255),
      address VARCHAR(400),
      owner_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ratings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      store_id INTEGER REFERENCES stores(id),
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, store_id)
    )
  `)
}

async function upsertUser(name, email, password, address, role) {
  const hashed = await bcrypt.hash(password, 10)
  const result = await pool.query(
    `
      INSERT INTO users (name, email, password, address, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE
      SET name = EXCLUDED.name,
          password = EXCLUDED.password,
          address = EXCLUDED.address,
          role = EXCLUDED.role
      RETURNING id
    `,
    [name, email, hashed, address, role]
  )

  return result.rows[0].id
}

async function seedData() {
  const adminId = await upsertUser(
    'System Admin Account',
    'admin@example.com',
    'Admin@123',
    '123 Admin Street',
    'admin'
  )

  const ownerId = await upsertUser(
    'Store Owner Account',
    'owner@example.com',
    'Owner@123',
    '45 Market Road',
    'store_owner'
  )

  const userId = await upsertUser(
    'Normal User Account',
    'user@example.com',
    'User@123',
    '12 Green Avenue',
    'user'
  )

  const storeCount = await pool.query('SELECT COUNT(*)::int AS count FROM stores')

  if (storeCount.rows[0].count === 0) {
    const store = await pool.query(
      `
        INSERT INTO stores (name, email, address, owner_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      ['Corner Store', 'corner@store.com', '8 Station Road', ownerId]
    )

    await pool.query(
      `
        INSERT INTO ratings (user_id, store_id, rating)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, store_id) DO UPDATE
        SET rating = EXCLUDED.rating
      `,
      [userId, store.rows[0].id, 4]
    )
  }

  return { adminId }
}

async function setupDatabase() {
  await ensureTables()
  return seedData()
}

module.exports = setupDatabase