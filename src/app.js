const express = require('express');
const createDataFile = require('./api/api');
const cors = require('cors');
const path = require('path')
const authRoute = require('./routes/authRoute')
const adminRoute = require('./routes/adminRoute')
const apiRoute = require('./routes/apiRoute');
const frontendRoute = require('./routes/frontendRoute')
const blogRoute = require('./routes/blogRoute')

const app = express();
// app.use(cors());

app.use(cors({
  origin: 'http://127.0.0.1:5500'
}));

app.use(express.json())

// Serve shared frontend assets (css/js) from src/public
app.use(express.static(path.join(__dirname, 'public')))

const logger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next()
}

app.use(logger);
app.use('/', frontendRoute)
app.use('/', authRoute)
app.use('/admin', adminRoute)
app.use('/api', apiRoute)
app.use( '/api/blog', blogRoute)


const apiPath = path.join(__dirname, 'api', 'data')
const apiFileCreated = createDataFile('api.json', apiPath)
if (apiFileCreated) {
  console.log(`API file Generated Successfully at ${apiPath}`)
} else {
  console.log(`API file already exists at ${apiPath}`)
}






app.use((req, res, next) => {
  res.status(404).sendFile(__dirname + '/404.html')
})

module.exports = app