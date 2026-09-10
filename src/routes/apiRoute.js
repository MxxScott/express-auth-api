const express = require('express')
const router = express.Router()
const fs = require('fs');
const path = require('path');
const { getApi } = require('../controllers/apiController');


router.get('/', getApi)

module.exports = router