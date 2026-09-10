const fs = require('fs')
const path = require('path')
const DATA_FILE = path.join(__dirname, '..', 'api', 'data', 'api.json')

const getApi = (req, res) => {
    res.json(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')))
}

module.exports = {getApi}