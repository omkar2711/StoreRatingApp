const { Pool } = require('pg')
require('dotenv').config()

function cleanDatabaseUrl(url) {
  if (!url) {
    return ''
  }

  const parsed = new URL(url)
  parsed.searchParams.delete('sslmode')
  parsed.searchParams.delete('uselibpqcompat')
  return parsed.toString()
}

const connectionString = cleanDatabaseUrl(process.env.DATABASE_URL)

const pool = new Pool({
  connectionString,
  ssl: connectionString ? { rejectUnauthorized: false } : false,
})

module.exports = pool