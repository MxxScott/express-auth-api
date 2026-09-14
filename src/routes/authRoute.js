const express = require('express')
const router = express.Router()
const { register, login, getUser, deleteUser, resetPassword, forgotPassword } = require('../controllers/authController')
const { auth, roleAuth } = require('../middleware/authMiddleware')
const { forgotPasswordLimiter, resetPasswordLimiter, loginLimiter } = require('../middleware/rateLimitMiddleware')

router.post('/register', register)
router.post('/login', loginLimiter, login)

// The signed in user's own account
router.get('/me', auth, getUser)
router.delete('/me', auth, deleteUser)

// Example of restricting a route to specific roles
router.get('/role', roleAuth('admin', 'user'), (req, res) => {
    res.status(200).json({ message: `Access granted for role: ${req.user.role}` });
})

router.post('/forgot-password', forgotPasswordLimiter, forgotPassword)
router.post('/reset-password', resetPasswordLimiter, resetPassword)

module.exports = router
