require('dotenv').config()
const app = require('./app')
const connectDB = require('./config/database')
const PORT = process.env.PORT || 8090;

const startServer = async () => {
  const connected = await connectDB(process.env.MONGODB_URI_BLOG)
  if (!connected) {
    process.exitCode = 1
    return
  }

  // Always at the bottom of the server
  app.listen(PORT, () => {
    console.log(`Server is running on Port ${PORT}`)
  })
}

startServer()