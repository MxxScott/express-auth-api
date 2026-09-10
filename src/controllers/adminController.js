const bcrypt = require('bcryptjs')
const User = require('../models/authModel')
const { publicUser, normalizeEmail, validateCredentials, handleError } = require('../utils/userUtils')

const ROLES = ['user', 'admin']

// GET /admin/users - list every account, newest first
const listUsers = async (req, res) => {
    try {
        const { role, search } = req.query
        const filter = {}

        if (role) {
            if (!ROLES.includes(role)) {
                return res.status(400).json({ message: `Role must be one of: ${ROLES.join(', ')}` })
            }
            filter.role = role
        }

        if (search) {
            const term = String(search).trim()
            filter.$or = [
                { name: { $regex: term, $options: 'i' } },
                { email: { $regex: term, $options: 'i' } }
            ]
        }

        const users = await User.find(filter).select('-password').sort({ createdAt: -1 })
        res.status(200).json({ count: users.length, users })
    } catch (error) {
        handleError(res, error, 'listUsers')
    }
}

// GET /admin/users/:id - fetch a single account
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password')
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }
        res.status(200).json({ user })
    } catch (error) {
        handleError(res, error, 'getUserById')
    }
}

// POST /admin/users - create an account with any role
const createUser = async (req, res) => {
    try {
        const { name, password, role } = req.body
        const email = normalizeEmail(req.body.email)

        const invalid = validateCredentials({ name, email, password })
        if (invalid) {
            return res.status(400).json({ message: invalid })
        }

        if (role && !ROLES.includes(role)) {
            return res.status(400).json({ message: `Role must be one of: ${ROLES.join(', ')}` })
        }

        if (await User.findOne({ email })) {
            return res.status(400).json({ message: 'User already exists' })
        }

        const user = await User.create({
            name,
            email,
            password: await bcrypt.hash(password, 10),
            ...(role ? { role } : {})
        })

        res.status(201).json({ message: 'User created successfully', user: publicUser(user) })
    } catch (error) {
        handleError(res, error, 'createUser')
    }
}

// PATCH /admin/users/:id/role - promote or demote an account
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body

        if (!ROLES.includes(role)) {
            return res.status(400).json({ message: `Role must be one of: ${ROLES.join(', ')}` })
        }

        // Stop an admin from demoting themselves and losing access
        if (req.params.id === req.user.id && role !== 'admin') {
            return res.status(400).json({ message: 'You cannot remove your own admin role' })
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { returnDocument: 'after', runValidators: true }
        ).select('-password')

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        res.status(200).json({ message: `Role updated to ${role}`, user })
    } catch (error) {
        handleError(res, error, 'updateUserRole')
    }
}

// DELETE /admin/users/:id - remove any account
const deleteUserById = async (req, res) => {
    try {
        // Deleting yourself here would lock you out of the panel
        if (req.params.id === req.user.id) {
            return res.status(400).json({ message: 'You cannot delete your own admin account here' })
        }

        const user = await User.findByIdAndDelete(req.params.id)
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        res.status(200).json({ message: 'User deleted successfully', user: publicUser(user) })
    } catch (error) {
        handleError(res, error, 'deleteUserById')
    }
}

// GET /admin/stats - dashboard counters
const getStats = async (req, res) => {
    try {
        const [total, admins, users] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'admin' }),
            User.countDocuments({ role: 'user' })
        ])

        const newest = await User.findOne().select('-password').sort({ createdAt: -1 })

        res.status(200).json({ stats: { total, admins, users }, newest })
    } catch (error) {
        handleError(res, error, 'getStats')
    }
}

module.exports = { listUsers, getUserById, createUser, updateUserRole, deleteUserById, getStats }
