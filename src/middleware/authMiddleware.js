const jwt = require('jsonwebtoken')

// Verifies the Bearer token and attaches the payload to req.user.
// Returns true when the request may continue.
const verifyToken = (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        res.status(401).json({ message: 'No token, authorization denied' });
        return false;
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        return true;
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
        return false;
    }
}

// Any logged in user
const auth = (req, res, next) => {
    if (verifyToken(req, res)) {
        next();
    }
}

// Only the listed roles, e.g. roleAuth('admin') or roleAuth('admin', 'user')
const roleAuth = (...requiredRole) => {
    return (req, res, next) => {
        if (!verifyToken(req, res)) {
            return;
        }

        if (!requiredRole.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied, insufficient privileges' });
        }

        next();
    }
}

// Admins only
const adminAuth = (req, res, next) => {
    if (!verifyToken(req, res)) {
        return;
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied, admin only' });
    }

    next();
}

module.exports = { auth, adminAuth, roleAuth }
