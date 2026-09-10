/* Shared helpers for the auth + admin controllers */

const MIN_PASSWORD = 6

// Strip the password hash before sending a user back to the client
const publicUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
})

// Emails are compared case-insensitively, so store them normalized
const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

// Returns an error string when the payload is unusable, otherwise null
const validateCredentials = ({ name, email, password }, { requireName = true } = {}) => {
    if (requireName && !String(name || '').trim()) {
        return 'Name is required'
    }
    if (!normalizeEmail(email)) {
        return 'Email is required'
    }
    if (!password) {
        return 'Password is required'
    }
    if (String(password).length < MIN_PASSWORD) {
        return `Password must be at least ${MIN_PASSWORD} characters`
    }
    return null
}

// Turn thrown errors into the right status code without leaking internals
const handleError = (res, error, action) => {
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message })
    }
    if (error.code === 11000) {
        return res.status(400).json({ message: 'User already exists' })
    }
    if (error.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid id format' })
    }
    console.error(`${action} failed:`, error)
    return res.status(500).json({ message: 'Server error' })
}

module.exports = { MIN_PASSWORD, publicUser, normalizeEmail, validateCredentials, handleError }
