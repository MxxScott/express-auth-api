const express = require('express')
const router = express.Router()
const { register, login, getUser, deleteUser } = require('../controllers/authController')
const { auth, roleAuth } = require('../middleware/authMiddleware')

router.post('/register', register)
router.post('/login', login)

// The signed in user's own account
router.get('/me', auth, getUser)
router.delete('/me', auth, deleteUser)

// Example of restricting a route to specific roles
router.get('/role', roleAuth('admin', 'user'), (req, res) => {
    res.status(200).json({ message: `Access granted for role: ${req.user.role}` });
})

module.exports = router
