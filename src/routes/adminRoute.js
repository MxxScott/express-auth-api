const express = require('express')
const router = express.Router()
const {
    listUsers,
    getUserById,
    createUser,
    updateUserRole,
    deleteUserById,
    getStats
} = require('../controllers/adminController')
const { adminAuth } = require('../middleware/authMiddleware')

// Every route below is admin only
router.use(adminAuth)

router.get('/stats', getStats)
router.get('/users', listUsers)
router.post('/users', createUser)
router.get('/users/:id', getUserById)
router.patch('/users/:id/role', updateUserRole)
router.delete('/users/:id', deleteUserById)

module.exports = router
