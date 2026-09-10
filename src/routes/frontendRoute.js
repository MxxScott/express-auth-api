const express = require('express')
const { home, login, profile, admin, blog, favicon} = require('../controllers/frontendController')
const router = express.Router()
const path = require('path')

router.get('/', home)
router.get('/login', login)
router.get('/profile', profile)
router.get('/admin', admin)
router.get('/blog', blog)
router.get('/favicon.svg', favicon)

module.exports = router