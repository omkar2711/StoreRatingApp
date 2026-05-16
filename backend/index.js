require('dotenv').config()
const express = require('express')
const cors = require('cors')
const setupDatabase = require('./service/seed')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Store Rating App API is running' })
})

app.use('/api/auth', require('./router/auth'))
app.use('/api/stores', require('./router/stores'))
app.use('/api/ratings', require('./router/ratings'))
app.use('/api/users', require('./router/users'))

const startPort = Number(process.env.PORT) || 5001

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && port < startPort + 10) {
      startServer(port + 1)
      return
    }

    console.error('Failed to start server')
    console.error(error)
    process.exit(1)
  })
}

setupDatabase()
  .then(() => {
    startServer(startPort)
  })
  .catch((error) => {
    console.error('Failed to start server')
    console.error(error)
    process.exit(1)
  })