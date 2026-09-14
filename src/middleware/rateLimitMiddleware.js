const rateLimit = require('express-rate-limit')

const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 3,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        message: 'Too many reset requests. Please try again later.'
    }
})

const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        message: 'Too many reset attempts. Please try again later.'
    }
})

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        message: 'Too many login attempts. Please try again later.'
    }
})

module.exports = { forgotPasswordLimiter, resetPasswordLimiter, loginLimiter }